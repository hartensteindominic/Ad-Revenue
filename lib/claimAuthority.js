/**
 * Server-side claim authority for Voxel Vault drops.
 * Client distance is UX only. This module is the gate before any mint/transfer intent.
 */

import { createHash, randomBytes } from 'node:crypto';
import { isDropDiscoverable, isWithinDropZone } from './dropEngine.js';

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
  if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
    throw new Error('A valid wallet connection is required');
  }
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
    lat: drop.lat ?? null,
    lng: drop.lng ?? null,
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
    lat: row.lat,
    lng: row.lng,
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
        lat: data.lat,
        lng: data.lng,
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
        lat: row.lat,
        lng: row.lng,
        collectible: row.collectible,
      }));
    }
  }
  return [...memory.drops.values()].filter((d) => ['active', 'scheduled'].includes(d.status));
}

export async function authorizeClaim({ dropId, walletAddress, distanceMeters = null, requireInZone = false } = {}) {
  const wallet = normalizeWallet(walletAddress);
  const drop = await getDrop(dropId);
  if (!drop) throw new Error('Drop not found');
  if (!isDropDiscoverable(drop)) throw new Error('Drop is not currently active');
  if (drop.claimedCount >= drop.quantity) throw new Error('Drop is exhausted');

  if (requireInZone) {
    if (!Number.isFinite(distanceMeters)) throw new Error('Distance required for zone check');
    if (!isWithinDropZone(drop, distanceMeters)) throw new Error('Outside public drop zone');
  }

  const claimKey = `${drop.id}:${wallet}`;
  const db = await getSupabase();

  if (db) {
    const { data: existing } = await db.from('voxel_claims').select('id,status,claim_ticket').eq('drop_id', drop.id).eq('wallet_address', wallet).maybeSingle();
    if (existing) return { authorized: false, reason: 'already_claimed', claimTicket: existing.claim_ticket, status: existing.status, serverValidation: true, storage: 'supabase' };
  } else if (memory.claims.has(claimKey)) {
    const existing = memory.claims.get(claimKey);
    return { authorized: false, reason: 'already_claimed', claimTicket: existing.claimTicket, status: existing.status, serverValidation: true, storage: 'memory' };
  }

  const claimTicket = ticketFor(drop.id, wallet);
  const record = {
    dropId: drop.id,
    walletAddress: wallet,
    status: 'authorized',
    claimTicket,
    clientDistanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
    createdAt: new Date().toISOString(),
    security: {
      locationCheck: 'client-supplied-distance-is-UX-only',
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
      status: 'authorized',
      claim_ticket: claimTicket,
      client_distance_meters: record.clientDistanceMeters,
    });
    if (claimErr) {
      if (String(claimErr.message).includes('duplicate') || claimErr.code === '23505') {
        return { authorized: false, reason: 'already_claimed', serverValidation: true, storage: 'supabase' };
      }
      throw new Error(claimErr.message);
    }
  }

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
    storage: db ? 'supabase' : 'memory',
    note: db
      ? 'Claim authorized by server. Inventory is reserved only by the claim record; ownership is not granted until chain confirmation.'
      : 'Claim authorized in ephemeral server memory (Supabase not configured). Not multi-instance durable.',
  };
}

export async function saveTradeOffer(offer) {
  const db = await getSupabase();
  memory.trades.set(offer.id, offer);
  if (db) {
    const { error } = await db.from('voxel_trade_offers').upsert({ id: offer.id, state: offer.state, offerer: offer.offerer, recipient: offer.recipient, offered: offer.offered, requested: offer.requested, expires_at: offer.expiresAt, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
  }
  return offer;
}

export async function getTradeOffer(id) {
  const db = await getSupabase();
  if (db) {
    const { data } = await db.from('voxel_trade_offers').select('*').eq('id', id).maybeSingle();
    if (data) return { id: data.id, state: data.state, offerer: data.offerer, recipient: data.recipient, offered: data.offered, requested: data.requested, expiresAt: data.expires_at, createdAt: data.created_at };
  }
  return memory.trades.get(id) || null;
}
