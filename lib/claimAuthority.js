/**
 * Server-side authority for Voxel Vault discovery, finite claims and trade state.
 * Client proximity is UX only. Ownership is never granted by this module.
 */

import { createHash, randomBytes } from 'node:crypto';
import { isDropDiscoverable, isWithinDropZone } from './dropEngine.js';

const memory = { drops: new Map(), claims: new Map(), trades: new Map() };
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
  if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
    throw new Error('A valid wallet connection is required');
  }
  return address.trim().toLowerCase();
}

function ticketFor(dropId, wallet) {
  const nonce = randomBytes(16).toString('hex');
  const payload = `${dropId}:${wallet}:${nonce}:${Date.now()}`;
  return `vvclaim_${createHash('sha256').update(payload).digest('hex')}`;
}

export function seedMemoryDrop(drop) {
  if (!drop?.id) return;
  memory.drops.set(drop.id, { ...drop, claimedCount: Number(drop.claimedCount || 0) });
}

function mapDrop(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    quantity: row.quantity,
    claimedCount: row.claimed_count,
    discovery: { publicZoneId: row.public_zone_id, radiusMeters: row.radius_meters },
    schedule: { startAt: row.start_at, endAt: row.end_at },
    claimRules: { maxClaimsPerWallet: row.max_claims_per_wallet },
    lat: row.lat,
    lng: row.lng,
    collectible: row.collectible,
  };
}

export async function upsertDrop(drop) {
  const db = await getSupabase();
  const row = {
    id: String(drop.id),
    name: String(drop.name),
    status: drop.status || 'active',
    quantity: Number(drop.quantity || 1),
    claimed_count: Number(drop.claimedCount || 0),
    public_zone_id: drop.discovery?.publicZoneId || drop.publicZoneId || null,
    radius_meters: Number(drop.discovery?.radiusMeters || drop.radiusMeters || 50),
    lat: drop.lat ?? null,
    lng: drop.lng ?? null,
    start_at: drop.schedule?.startAt || drop.startAt || null,
    end_at: drop.schedule?.endAt || drop.endAt || null,
    max_claims_per_wallet: Number(drop.claimRules?.maxClaimsPerWallet || 1),
    collectible: drop.collectible || {},
  };
  memory.drops.set(row.id, mapDrop(row));
  if (db) {
    const { error } = await db.from('voxel_drops').upsert(row);
    if (error) throw new Error(`Drop persist failed: ${error.message}`);
  }
  return memory.drops.get(row.id);
}

export async function getDrop(dropId) {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_drops').select('*').eq('id', dropId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return mapDrop(data);
  }
  return memory.drops.get(dropId) || null;
}

export async function listDrops() {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_drops').select('*').in('status', ['active', 'scheduled']);
    if (error) throw new Error(error.message);
    if (data) return data.map(mapDrop);
  }
  return [...memory.drops.values()].filter((d) => ['active', 'scheduled'].includes(d.status));
}

export async function authorizeClaim({ dropId, walletAddress, distanceMeters = null, requireInZone = false } = {}) {
  const wallet = normalizeWallet(walletAddress);
  const drop = await getDrop(dropId);
  if (!drop) throw new Error('Drop not found');
  if (!isDropDiscoverable(drop)) throw new Error('Drop is not currently active');

  if (requireInZone) {
    if (!Number.isFinite(distanceMeters)) throw new Error('Distance required for zone check');
    if (!isWithinDropZone(drop, distanceMeters)) throw new Error('Outside public drop zone');
  }

  const db = await getSupabase();
  const claimTicket = ticketFor(drop.id, wallet);

  if (db) {
    // The database function locks the drop row and increments capacity atomically.
    // This is the authoritative path for multi-instance production deployments.
    const { data, error } = await db.rpc('reserve_voxel_drop_claim', {
      p_drop_id: drop.id,
      p_wallet_address: wallet,
      p_claim_ticket: claimTicket,
      p_client_distance_meters: Number.isFinite(distanceMeters) ? distanceMeters : null,
    });

    if (error) {
      const message = String(error.message || '').toLowerCase();
      if (error.code === '23505' || message.includes('already claimed')) {
        const { data: existing } = await db
          .from('voxel_claims')
          .select('status,claim_ticket')
          .eq('drop_id', drop.id)
          .eq('wallet_address', wallet)
          .maybeSingle();
        return {
          authorized: false,
          reason: 'already_claimed',
          claimTicket: existing?.claim_ticket,
          status: existing?.status || 'authorized',
          serverValidation: true,
          storage: 'supabase',
        };
      }
      throw new Error(error.message);
    }

    const reserved = Array.isArray(data) ? data[0] : data;
    return {
      authorized: true,
      claimTicket: reserved?.claim_ticket || claimTicket,
      dropId: drop.id,
      walletAddress: wallet,
      status: 'authorized',
      collectible: drop.collectible || null,
      security: {
        locationCheck: 'client-supplied-distance-is-UX-only',
        serverValidationRequired: true,
        replayProtectionRequired: true,
        ownership: 'not-granted-until-chain-confirmation',
      },
      nextStep: 'wallet_signature_then_chain_settlement',
      serverValidation: true,
      storage: 'supabase',
      note: 'Claim capacity was reserved atomically by the database. Ownership is not granted until chain confirmation.',
    };
  }

  // Development-only fallback. Production claim routes fail closed without Supabase.
  const claimKey = `${drop.id}:${wallet}`;
  if (memory.claims.has(claimKey)) {
    const existing = memory.claims.get(claimKey);
    return { authorized: false, reason: 'already_claimed', claimTicket: existing.claimTicket, status: existing.status, serverValidation: true, storage: 'memory' };
  }
  if (drop.claimedCount >= drop.quantity) throw new Error('Drop is exhausted');

  const record = {
    dropId: drop.id,
    walletAddress: wallet,
    status: 'authorized',
    claimTicket,
    clientDistanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
    createdAt: new Date().toISOString(),
    security: { locationCheck: 'client-supplied-distance-is-UX-only', serverValidationRequired: true, replayProtectionRequired: true, ownership: 'not-granted-until-chain-confirmation' },
  };
  memory.claims.set(claimKey, record);
  drop.claimedCount = Number(drop.claimedCount || 0) + 1;
  memory.drops.set(drop.id, drop);

  return {
    authorized: true,
    claimTicket,
    dropId: drop.id,
    walletAddress: wallet,
    status: 'authorized',
    collectible: drop.collectible || null,
    security: record.security,
    nextStep: 'wallet_signature_then_chain_settlement',
    serverValidation: true,
    storage: 'memory',
    note: 'Development claim authorized in ephemeral memory. Production routes require durable Supabase storage.',
  };
}

function mapTrade(row) {
  return {
    id: row.id,
    state: row.state,
    offerer: row.offerer,
    recipient: row.recipient,
    offered: row.offered,
    requested: row.requested,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    txHash: row.tx_hash || undefined,
    confirmedAt: row.confirmed_at || undefined,
    chainId: row.chain_id == null ? undefined : Number(row.chain_id),
    blockNumber: row.block_number == null ? undefined : Number(row.block_number),
    settlementContract: row.settlement_contract || undefined,
    semanticSettlementVerified: Boolean(row.semantic_settlement_verified),
    settlementEvent: row.settlement_event || undefined,
    tokenId: row.token_id || undefined,
  };
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
      tx_hash: offer.txHash || null,
      confirmed_at: offer.confirmedAt || null,
      chain_id: offer.chainId ?? null,
      block_number: offer.blockNumber ?? null,
      settlement_contract: offer.settlementContract || null,
      semantic_settlement_verified: Boolean(offer.semanticSettlementVerified),
      settlement_event: offer.settlementEvent || null,
      token_id: offer.tokenId == null ? null : String(offer.tokenId),
    });
    if (error) throw new Error(error.message);
  }
  return offer;
}

export async function getTradeOffer(id) {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_trade_offers').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return mapTrade(data);
  }
  return memory.trades.get(id) || null;
}
