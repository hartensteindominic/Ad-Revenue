/**
 * Server-side claim authority for Voxel Vault drops.
 * Client distance is UX only. Authoritative proximity requires a short-lived signed proof.
 */

import { createHash, randomBytes } from 'node:crypto';
import { verifyProximityProof } from './proximityProof.js';
import { isDropDiscoverable } from './dropEngine.js';

const memory = {
  drops: new Map(),
  claims: new Map(), // key: `${dropId}:${wallet}`
  trades: new Map(),
};

let supabase = null;
let supabaseTried = false;

async function getSupabase() {
  if (supabaseTried) return supabase;
  supabaseTried = true;
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    return supabase;
  } catch {
    return null;
  }
}

function normalizeWallet(address) {
  if (typeof address !== 'string' || !address.trim()) throw new Error('Wallet connection is required');
  return address.trim().toLowerCase();
}

function ticketFor(dropId, wallet) {
  const nonce = randomBytes(8).toString('hex');
  const payload = `${dropId}:${wallet}:${nonce}:${Date.now()}`;
  const hash = createHash('sha256').update(payload).digest('hex').slice(0, 32);
  return `vvclaim_${hash}`;
}

export function seedMemoryDrop(drop) {
  if (!drop?.id) return;
  memory.drops.set(drop.id, { ...drop, claimedCount: drop.claimedCount || 0 });
}

export async function upsertDrop(drop) {
  const db = await getSupabase();
  const row = {
    id: drop.id,
    name: drop.name,
    status: drop.status || 'active',
    quantity: drop.quantity || 1,
    claimed_count: drop.claimedCount || 0,
    public_zone_id: drop.discovery?.publicZoneId || drop.publicZoneId || null,
    radius_meters: drop.discovery?.radiusMeters || drop.radiusMeters || 50,
    start_at: drop.schedule?.startAt || drop.startAt || null,
    end_at: drop.schedule?.endAt || drop.endAt || null,
    max_claims_per_wallet: drop.claimRules?.maxClaimsPerWallet || 1,
    collectible: drop.collectible || {},
  };

  memory.drops.set(drop.id, {
    id: row.id,
    name: row.name,
    status: row.status,
    quantity: row.quantity,
    claimedCount: row.claimed_count,
    discovery: { publicZoneId: row.public_zone_id, radiusMeters: row.radius_meters },
    schedule: { startAt: row.start_at, endAt: row.end_at },
    claimRules: { maxClaimsPerWallet: row.max_claims_per_wallet },
    collectible: row.collectible,
  });

  if (db) {
    const { error } = await db.from('voxel_drops').upsert(row);
    if (error) throw new Error(`Drop persist failed: ${error.message}`);
  }

  return memory.drops.get(drop.id);
}

export async function getDrop(dropId) {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_drops').select('*').eq('id', dropId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) {
      return {
        id: data.id,
        name: data.name,
        status: data.status,
        quantity: data.quantity,
        claimedCount: data.claimed_count,
        discovery: { publicZoneId: data.public_zone_id, radiusMeters: data.radius_meters },
        schedule: { startAt: data.start_at, endAt: data.end_at },
        claimRules: { maxClaimsPerWallet: data.max_claims_per_wallet },
        collectible: data.collectible,
      };
    }
  }
  return memory.drops.get(dropId) || null;
}

export async function listDrops() {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_drops').select('*').in('status', ['active', 'scheduled']);
    if (!error && data?.length) {
      return data.map((row) => ({
        id: row.id,
        name: row.name,
        status: row.status,
        quantity: row.quantity,
        claimedCount: row.claimed_count,
        discovery: { publicZoneId: row.public_zone_id, radiusMeters: row.radius_meters },
        schedule: { startAt: row.start_at, endAt: row.end_at },
        claimRules: { maxClaimsPerWallet: row.max_claims_per_wallet },
        collectible: row.collectible,
      }));
    }
  }
  return [...memory.drops.values()].filter((d) => ['active', 'scheduled'].includes(d.status));
}

/**
 * Reserve a claim. Reservation does not consume supply. Final settlement must happen
 * after authoritative chain confirmation, which prevents failed transactions from
 * permanently consuming a drop.
 */
export async function authorizeClaim({
  dropId,
  walletAddress,
  distanceMeters = null,
  requireInZone = false,
  proximityProof = null,
} = {}) {
  const wallet = normalizeWallet(walletAddress);
  const drop = await getDrop(dropId);
  if (!drop) throw new Error('Drop not found');
  if (!isDropDiscoverable(drop)) throw new Error('Drop is not currently active');

  if (drop.claimedCount >= drop.quantity) throw new Error('Drop is exhausted');

  let proximity = null;
  if (requireInZone) {
    proximity = verifyProximityProof(proximityProof, wallet, dropId);
    if (!proximity.valid) throw new Error(`Proximity proof rejected: ${proximity.reason}`);
  }

  const claimKey = `${drop.id}:${wallet}`;
  const db = await getSupabase();

  if (db) {
    const { data: existing } = await db
      .from('voxel_claims')
      .select('id,status,claim_ticket')
      .eq('drop_id', drop.id)
      .eq('wallet_address', wallet)
      .maybeSingle();
    if (existing && ['reserved', 'authorized', 'submitted', 'confirmed'].includes(existing.status)) {
      return {
        authorized: false,
        reason: existing.status === 'confirmed' ? 'already_claimed' : 'claim_reserved',
        claimTicket: existing.claim_ticket,
        status: existing.status,
        serverValidation: true,
        storage: 'supabase',
      };
    }
  } else if (memory.claims.has(claimKey)) {
    const existing = memory.claims.get(claimKey);
    if (['reserved', 'authorized', 'submitted', 'confirmed'].includes(existing.status)) {
      return {
        authorized: false,
        reason: existing.status === 'confirmed' ? 'already_claimed' : 'claim_reserved',
        claimTicket: existing.claimTicket,
        status: existing.status,
        serverValidation: true,
        storage: 'memory',
      };
    }
  }

  const claimTicket = ticketFor(drop.id, wallet);
  const record = {
    dropId: drop.id,
    walletAddress: wallet,
    status: 'reserved',
    claimTicket,
    clientDistanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
    proximityProof: proximity ? { spatialCell: proximity.spatialCell, scoreBps: proximity.scoreBps, expiresAt: proximity.expiresAt } : null,
    createdAt: new Date().toISOString(),
    security: {
      locationCheck: requireInZone ? 'signed-proximity-proof' : 'not-required',
      clientDistanceIsUxOnly: true,
      serverValidationRequired: true,
      replayProtectionRequired: true,
      ownership: 'not-granted-until-chain-confirmation',
    },
  };

  memory.claims.set(claimKey, record);

  if (db) {
    const { error: claimErr } = await db.from('voxel_claims').insert({
      drop_id: drop.id,
      wallet_address: wallet,
      status: 'reserved',
      claim_ticket: claimTicket,
      client_distance_meters: record.clientDistanceMeters,
    });
    if (claimErr) {
      if (String(claimErr.message).includes('duplicate') || claimErr.code === '23505') {
        return { authorized: false, reason: 'claim_reserved', serverValidation: true, storage: 'supabase' };
      }
      throw new Error(claimErr.message);
    }
  }

  return {
    authorized: true,
    claimTicket,
    dropId: drop.id,
    walletAddress: wallet,
    status: 'reserved',
    collectible: drop.collectible || null,
    security: record.security,
    nextStep: 'explicit_wallet_action_then_authoritative_chain_settlement',
    serverValidation: true,
    storage: db ? 'supabase' : 'memory',
  };
}

export async function markClaimSubmitted({ dropId, walletAddress, claimTicket, transactionHash } = {}) {
  const wallet = normalizeWallet(walletAddress);
  if (!claimTicket || !transactionHash) throw new Error('Claim ticket and transaction hash are required');
  const key = `${dropId}:${wallet}`;
  const record = memory.claims.get(key);
  if (record && record.claimTicket === claimTicket) {
    record.status = 'submitted';
    record.transactionHash = transactionHash;
    memory.claims.set(key, record);
  }
  const db = await getSupabase();
  if (db) {
    const { error } = await db
      .from('voxel_claims')
      .update({ status: 'submitted', transaction_hash: transactionHash })
      .eq('drop_id', dropId)
      .eq('wallet_address', wallet)
      .eq('claim_ticket', claimTicket);
    if (error) throw new Error(error.message);
  }
  return { status: 'submitted', dropId, walletAddress: wallet, claimTicket, transactionHash };
}

export async function markClaimConfirmed({ dropId, walletAddress, claimTicket, tokenId = null } = {}) {
  const wallet = normalizeWallet(walletAddress);
  if (!claimTicket) throw new Error('Claim ticket is required');
  const key = `${dropId}:${wallet}`;
  const record = memory.claims.get(key);
  if (record && record.claimTicket === claimTicket) {
    if (record.status === 'confirmed') return { status: 'confirmed', alreadyFinalized: true };
    record.status = 'confirmed';
    record.tokenId = tokenId;
    memory.claims.set(key, record);
  }

  const drop = await getDrop(dropId);
  if (!drop) throw new Error('Drop not found');
  if (drop.claimedCount >= drop.quantity) throw new Error('Drop exhausted');

  const db = await getSupabase();
  if (db) {
    const { data: claim, error: claimError } = await db
      .from('voxel_claims')
      .select('status')
      .eq('drop_id', dropId)
      .eq('wallet_address', wallet)
      .eq('claim_ticket', claimTicket)
      .maybeSingle();
    if (claimError) throw new Error(claimError.message);
    if (!claim) throw new Error('Claim reservation not found');
    if (claim.status === 'confirmed') return { status: 'confirmed', alreadyFinalized: true };
    const { error } = await db
      .from('voxel_claims')
      .update({ status: 'confirmed', token_id: tokenId == null ? null : String(tokenId) })
      .eq('drop_id', dropId)
      .eq('wallet_address', wallet)
      .eq('claim_ticket', claimTicket);
    if (error) throw new Error(error.message);
  }

  drop.claimedCount = (drop.claimedCount || 0) + 1;
  if (drop.claimedCount >= drop.quantity) drop.status = 'exhausted';
  memory.drops.set(dropId, drop);
  if (db) {
    const { error } = await db.from('voxel_drops').update({ claimed_count: drop.claimedCount, status: drop.status }).eq('id', dropId);
    if (error) throw new Error(error.message);
  }
  return { status: 'confirmed', dropId, walletAddress: wallet, claimTicket, tokenId };
}

export async function releaseClaimReservation({ dropId, walletAddress, claimTicket } = {}) {
  const wallet = normalizeWallet(walletAddress);
  const key = `${dropId}:${wallet}`;
  memory.claims.delete(key);
  const db = await getSupabase();
  if (db) {
    const { error } = await db
      .from('voxel_claims')
      .delete()
      .eq('drop_id', dropId)
      .eq('wallet_address', wallet)
      .eq('claim_ticket', claimTicket)
      .in('status', ['reserved', 'authorized']);
    if (error) throw new Error(error.message);
  }
  return { released: true, dropId, walletAddress: wallet };
}

export async function saveTradeOffer(offer) {
  const db = await getSupabase();
  memory.trades.set(offer.id, offer);
  if (db) {
    const { error } = await db.from('voxel_trade_offers').upsert({
      id: offer.id,
      state: offer.state,
      offerer: offer.offerer,
      recipient: offer.recipient,
      offered: offer.offered,
      requested: offer.requested,
      expires_at: offer.expiresAt,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
  }
  return offer;
}

export async function getTradeOffer(id) {
  const db = await getSupabase();
  if (db) {
    const { data } = await db.from('voxel_trade_offers').select('*').eq('id', id).maybeSingle();
    if (data) {
      return {
        id: data.id,
        state: data.state,
        offerer: data.offerer,
        recipient: data.recipient,
        offered: data.offered,
        requested: data.requested,
        expiresAt: data.expires_at,
        createdAt: data.created_at,
      };
    }
  }
  return memory.trades.get(id) || null;
}
