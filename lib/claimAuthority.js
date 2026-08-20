/**
 * Server-side claim authority for Voxel Vault drops.
 *
 * Security boundary:
 * - client distance is UX input only
 * - Supabase/Postgres is the production source of truth for finite capacity
 * - ownership is never granted by this module; chain confirmation is authoritative
 * - production fails closed when durable claim storage is unavailable
 */

import { createHash, randomBytes } from 'node:crypto';
import { isDropDiscoverable, isWithinDropZone } from './dropEngine.js';

const memory = {
  drops: new Map(),
  claims: new Map(),
  trades: new Map(),
};

let supabase = null;
let supabaseTried = false;

const CLAIM_TTL_MS = 10 * 60 * 1000;
const MAX_DROP_ID_LENGTH = 128;
const MAX_TICKET_LENGTH = 80;

async function getSupabase() {
  if (supabaseTried) return supabase;
  supabaseTried = true;

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema: 'public' },
    });
  } catch {
    supabase = null;
  }
  return supabase;
}

function normalizeWallet(address) {
  if (typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
    throw new Error('A valid wallet connection is required');
  }
  return address.trim().toLowerCase();
}

function normalizeDropId(dropId) {
  if (typeof dropId !== 'string') throw new Error('A valid drop id is required');
  const value = dropId.trim();
  if (!value || value.length > MAX_DROP_ID_LENGTH || !/^[a-zA-Z0-9._:-]+$/.test(value)) {
    throw new Error('A valid drop id is required');
  }
  return value;
}

function ticketFor(dropId, wallet) {
  const nonce = randomBytes(16).toString('hex');
  const payload = `${dropId}:${wallet}:${nonce}:${Date.now()}`;
  const hash = createHash('sha256').update(payload).digest('hex');
  return `vvclaim_${hash}`;
}

function productionStorageRequired() {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
}

export function seedMemoryDrop(drop) {
  if (!drop?.id) return;
  memory.drops.set(drop.id, { ...drop, claimedCount: drop.claimedCount || 0 });
}

export async function upsertDrop(drop) {
  const db = await getSupabase();
  const row = {
    id: normalizeDropId(drop.id),
    name: String(drop.name || '').trim().slice(0, 160),
    status: drop.status || 'active',
    quantity: Number.isInteger(drop.quantity) ? drop.quantity : 1,
    claimed_count: Number.isInteger(drop.claimedCount) ? drop.claimedCount : 0,
    public_zone_id: drop.discovery?.publicZoneId || drop.publicZoneId || null,
    radius_meters: Number.isFinite(Number(drop.discovery?.radiusMeters ?? drop.radiusMeters))
      ? Math.max(1, Math.min(100000, Number(drop.discovery?.radiusMeters ?? drop.radiusMeters)))
      : 50,
    lat: drop.lat ?? null,
    lng: drop.lng ?? null,
    start_at: drop.schedule?.startAt || drop.startAt || null,
    end_at: drop.schedule?.endAt || drop.endAt || null,
    max_claims_per_wallet: Number.isInteger(drop.claimRules?.maxClaimsPerWallet)
      ? Math.max(1, Math.min(100, drop.claimRules.maxClaimsPerWallet))
      : 1,
    collectible: drop.collectible || {},
  };

  if (!row.name) throw new Error('Drop name is required');
  if (row.quantity < 1 || row.quantity > 10000) throw new Error('Drop quantity must be 1-10000');

  const normalized = {
    id: row.id,
    name: row.name,
    status: row.status,
    quantity: row.quantity,
    claimedCount: row.claimed_count,
    reservedCount: Number(drop.reservedCount || 0),
    discovery: { publicZoneId: row.public_zone_id, radiusMeters: row.radius_meters },
    schedule: { startAt: row.start_at, endAt: row.end_at },
    claimRules: { maxClaimsPerWallet: row.max_claims_per_wallet },
    lat: row.lat,
    lng: row.lng,
    collectible: row.collectible,
  };

  memory.drops.set(row.id, normalized);

  if (db) {
    const { error } = await db.from('voxel_drops').upsert(row);
    if (error) throw new Error(`Drop persist failed: ${error.message}`);
  }
  return normalized;
}

function mapDropRow(data) {
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    status: data.status,
    quantity: data.quantity,
    claimedCount: data.claimed_count,
    reservedCount: data.reserved_count || 0,
    discovery: { publicZoneId: data.public_zone_id, radiusMeters: data.radius_meters },
    schedule: { startAt: data.start_at, endAt: data.end_at },
    claimRules: { maxClaimsPerWallet: data.max_claims_per_wallet },
    lat: data.lat,
    lng: data.lng,
    collectible: data.collectible,
  };
}

export async function getDrop(dropId) {
  const id = normalizeDropId(dropId);
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_drops').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return mapDropRow(data);
  }
  return memory.drops.get(id) || null;
}

export async function listDrops() {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db
      .from('voxel_drops')
      .select('*')
      .in('status', ['active', 'scheduled'])
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data || []).map(mapDropRow);
  }
  return [...memory.drops.values()].filter((d) => ['active', 'scheduled'].includes(d.status));
}

export async function authorizeClaim({ dropId, walletAddress, distanceMeters = null, requireInZone = false } = {}) {
  const id = normalizeDropId(dropId);
  const wallet = normalizeWallet(walletAddress);
  const drop = await getDrop(id);
  if (!drop) throw new Error('Drop not found');
  if (!isDropDiscoverable(drop)) throw new Error('Drop is not currently active');

  if (requireInZone) {
    if (!Number.isFinite(distanceMeters) || distanceMeters < 0 || distanceMeters > 1_000_000) {
      throw new Error('Distance required for zone check');
    }
    if (!isWithinDropZone(drop, distanceMeters)) throw new Error('Outside public drop zone');
  }

  const db = await getSupabase();
  if (!db && productionStorageRequired()) {
    const error = new Error('Claim service is temporarily unavailable');
    error.code = 'CLAIM_STORAGE_UNAVAILABLE';
    throw error;
  }

  const claimTicket = ticketFor(id, wallet);
  const expiresAt = new Date(Date.now() + CLAIM_TTL_MS).toISOString();
  const clientDistance = Number.isFinite(distanceMeters) ? Math.max(0, distanceMeters) : null;

  if (db) {
    const { data, error } = await db.rpc('reserve_voxel_claim', {
      p_drop_id: id,
      p_wallet_address: wallet,
      p_claim_ticket: claimTicket,
      p_client_distance_meters: clientDistance,
      p_expires_at: expiresAt,
    });

    if (error) throw new Error(`Claim authorization failed: ${error.message}`);
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.authorized) {
      return {
        authorized: false,
        reason: result?.reason || 'claim_denied',
        claimTicket: result?.claim_ticket || null,
        status: result?.status || null,
        serverValidation: true,
        storage: 'supabase',
      };
    }

    return {
      authorized: true,
      claimTicket: result.claim_ticket,
      dropId: id,
      walletAddress: wallet,
      status: 'authorized',
      expiresAt,
      collectible: drop.collectible || null,
      security: {
        locationCheck: requireInZone ? 'server-validates-client-distance-against-drop-policy' : 'not-required',
        serverValidationRequired: true,
        replayProtection: 'database-unique-drop-wallet',
        capacityReservation: 'atomic-postgres-transaction',
        ownership: 'not-granted-until-chain-confirmation',
      },
      nextStep: 'wallet_signature_then_chain_settlement',
      ownershipGranted: false,
      serverValidation: true,
      storage: 'supabase',
    };
  }

  // Local development fallback only. It is intentionally not a production path.
  const claimKey = `${id}:${wallet}`;
  if (memory.claims.has(claimKey)) {
    const existing = memory.claims.get(claimKey);
    return { authorized: false, reason: 'already_claimed', claimTicket: existing.claimTicket, status: existing.status, serverValidation: true, storage: 'memory' };
  }

  const currentReserved = Number(drop.reservedCount || 0);
  if (Number(drop.claimedCount || 0) + currentReserved >= drop.quantity) {
    return { authorized: false, reason: 'exhausted', serverValidation: true, storage: 'memory' };
  }

  const record = {
    dropId: id,
    walletAddress: wallet,
    status: 'authorized',
    claimTicket,
    expiresAt,
    clientDistanceMeters: clientDistance,
    createdAt: new Date().toISOString(),
  };
  memory.claims.set(claimKey, record);
  memory.drops.set(id, { ...drop, reservedCount: currentReserved + 1 });

  return {
    authorized: true,
    claimTicket,
    dropId: id,
    walletAddress: wallet,
    status: 'authorized',
    expiresAt,
    collectible: drop.collectible || null,
    security: {
      locationCheck: requireInZone ? 'client-distance-checked-locally-for-development' : 'not-required',
      serverValidationRequired: true,
      replayProtection: 'memory-only-development-mode',
      capacityReservation: 'memory-only-development-mode',
      ownership: 'not-granted-until-chain-confirmation',
    },
    nextStep: 'wallet_signature_then_chain_settlement',
    ownershipGranted: false,
    serverValidation: true,
    storage: 'memory',
  };
}

export async function saveTradeOffer(offer) {
  if (!offer?.id || typeof offer.id !== 'string') throw new Error('Trade offer id is required');
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
  } else if (productionStorageRequired()) {
    throw new Error('Trade storage is temporarily unavailable');
  }
  return offer;
}

export async function getTradeOffer(id) {
  if (typeof id !== 'string' || !id.trim()) return null;
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_trade_offers').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { id: data.id, state: data.state, offerer: data.offerer, recipient: data.recipient, offered: data.offered, requested: data.requested, expiresAt: data.expires_at, createdAt: data.created_at };
  }
  return memory.trades.get(id) || null;
}
