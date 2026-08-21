/**
 * Server-side claim authority for Voxel Vault drops.
 * Client distance is UX only. Authoritative proximity requires a short-lived signed proof.
 * Durable claim storage is required for production reservation/confirmation authority.
 */

import { createHash, randomBytes } from 'node:crypto';
import { verifyProximityProof } from './proximityProof.js';
import { isDropDiscoverable } from './dropEngine.js';
import { assertProductionStorage, reservationExpiresAt, isReservationActive, DEFAULT_TTL_SECONDS } from './claimReservation.js';

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
  } catch {}
  return supabase;
}

function normalizeWallet(address) {
  if (typeof address !== 'string' || !address.trim()) throw new Error('Wallet connection is required');
  return address.trim().toLowerCase();
}
function ticketFor(dropId, wallet) {
  const nonce = randomBytes(16).toString('hex');
  return `vvclaim_${createHash('sha256').update(`${dropId}:${wallet}:${nonce}:${Date.now()}`).digest('hex').slice(0, 40)}`;
}
function requireConfiguredStorage(db) { assertProductionStorage(db); return db; }

export function seedMemoryDrop(drop) {
  if (!drop?.id) return;
  memory.drops.set(drop.id, { ...drop, claimedCount: drop.claimedCount || 0 });
}

export async function upsertDrop(drop) {
  const db = await getSupabase();
  const row = {
    id: drop.id, name: drop.name, status: drop.status || 'active', quantity: drop.quantity || 1,
    claimed_count: drop.claimedCount || 0,
    public_zone_id: drop.discovery?.publicZoneId || drop.publicZoneId || null,
    radius_meters: drop.discovery?.radiusMeters || drop.radiusMeters || 50,
    start_at: drop.schedule?.startAt || drop.startAt || null,
    end_at: drop.schedule?.endAt || drop.endAt || null,
    max_claims_per_wallet: drop.claimRules?.maxClaimsPerWallet || 1,
    collectible: drop.collectible || {},
  };
  memory.drops.set(drop.id, { id: row.id, name: row.name, status: row.status, quantity: row.quantity,
    claimedCount: row.claimed_count, discovery: { publicZoneId: row.public_zone_id, radiusMeters: row.radius_meters },
    schedule: { startAt: row.start_at, endAt: row.end_at }, claimRules: { maxClaimsPerWallet: row.max_claims_per_wallet },
    collectible: row.collectible });
  if (db) { const { error } = await db.from('voxel_drops').upsert(row); if (error) throw new Error(`Drop persist failed: ${error.message}`); }
  return memory.drops.get(drop.id);
}

export async function getDrop(dropId) {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_drops').select('*').eq('id', dropId).maybeSingle();
    if (error) throw new Error(error.message);
    if (data) return { id: data.id, name: data.name, status: data.status, quantity: data.quantity, claimedCount: data.claimed_count,
      discovery: { publicZoneId: data.public_zone_id, radiusMeters: data.radius_meters },
      schedule: { startAt: data.start_at, endAt: data.end_at }, claimRules: { maxClaimsPerWallet: data.max_claims_per_wallet }, collectible: data.collectible };
  }
  return memory.drops.get(dropId) || null;
}

export async function listDrops() {
  const db = await getSupabase();
  if (db) {
    const { data, error } = await db.from('voxel_drops').select('*').in('status', ['active', 'scheduled']);
    if (!error && data?.length) return data.map((row) => ({ id: row.id, name: row.name, status: row.status, quantity: row.quantity,
      claimedCount: row.claimed_count, discovery: { publicZoneId: row.public_zone_id, radiusMeters: row.radius_meters },
      schedule: { startAt: row.start_at, endAt: row.end_at }, claimRules: { maxClaimsPerWallet: row.max_claims_per_wallet }, collectible: row.collectible }));
  }
  return [...memory.drops.values()].filter((d) => ['active', 'scheduled'].includes(d.status));
}

export async function authorizeClaim({ dropId, walletAddress, distanceMeters = null, requireInZone = false, proximityProof = null,
  reservationTtlSeconds = DEFAULT_TTL_SECONDS } = {}) {
  const wallet = normalizeWallet(walletAddress);
  const db = await getSupabase();
  if (requireInZone) {
    const proximity = verifyProximityProof(proximityProof, wallet, dropId);
    if (!proximity.valid) throw new Error(`Proximity proof rejected: ${proximity.reason}`);
  }
  if (requireInZone) requireConfiguredStorage(db);
  const drop = await getDrop(dropId);
  if (!drop) throw new Error('Drop not found');
  if (!isDropDiscoverable(drop)) throw new Error('Drop is not currently active');
  if (drop.claimedCount >= drop.quantity) throw new Error('Drop is exhausted');

  const expiresAt = reservationExpiresAt(Date.now(), reservationTtlSeconds);
  const claimKey = `${drop.id}:${wallet}`;
  if (!db) {
    if (memory.claims.has(claimKey)) {
      const existing = memory.claims.get(claimKey);
      if (existing.status === 'reserved' && isReservationActive(existing.status, existing.expiresAt)) return { authorized: false, reason: 'claim_reserved', claimTicket: existing.claimTicket, status: existing.status, expiresAt: existing.expiresAt, storage: 'memory' };
      if (existing.status === 'confirmed' || existing.status === 'submitted') return { authorized: false, reason: existing.status === 'confirmed' ? 'already_claimed' : 'claim_submitted', claimTicket: existing.claimTicket, status: existing.status, storage: 'memory' };
      memory.claims.delete(claimKey);
    }
    const claimTicket = ticketFor(drop.id, wallet);
    const record = { dropId: drop.id, walletAddress: wallet, status: 'reserved', claimTicket, clientDistanceMeters: Number.isFinite(distanceMeters) ? Number(distanceMeters) : null, createdAt: new Date().toISOString(), expiresAt };
    memory.claims.set(claimKey, record);
    return { authorized: true, claimTicket, dropId: drop.id, walletAddress: wallet, status: 'reserved', expiresAt, collectible: drop.collectible || null, serverValidation: true, storage: 'memory' };
  }

  const { data: existing, error: existingError } = await db.from('voxel_claims').select('id,status,claim_ticket,expires_at').eq('drop_id', drop.id).eq('wallet_address', wallet).maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) {
    if (existing.status === 'confirmed') return { authorized: false, reason: 'already_claimed', claimTicket: existing.claim_ticket, status: existing.status, storage: 'supabase' };
    if (existing.status === 'submitted') return { authorized: false, reason: 'claim_submitted', claimTicket: existing.claim_ticket, status: existing.status, storage: 'supabase' };
    if (isReservationActive(existing.status, existing.expires_at)) return { authorized: false, reason: 'claim_reserved', claimTicket: existing.claim_ticket, status: existing.status, expiresAt: existing.expires_at, storage: 'supabase' };
    const { error: releaseError } = await db.from('voxel_claims').update({ status: 'expired' }).eq('id', existing.id).eq('status', existing.status);
    if (releaseError) throw new Error(releaseError.message);
  }

  const claimTicket = ticketFor(drop.id, wallet);
  const { data: inserted, error: insertError } = await db.from('voxel_claims').insert({
    drop_id: drop.id, wallet_address: wallet, status: 'reserved', claim_ticket: claimTicket,
    client_distance_meters: Number.isFinite(distanceMeters) ? Number(distanceMeters) : null, expires_at: expiresAt,
  }).select('id,claim_ticket,status,expires_at').single();
  if (insertError) {
    if (insertError.code === '23505') return { authorized: false, reason: 'claim_reserved', serverValidation: true, storage: 'supabase' };
    throw new Error(insertError.message);
  }
  return { authorized: true, claimTicket: inserted.claim_ticket, dropId: drop.id, walletAddress: wallet, status: 'reserved', expiresAt: inserted.expires_at,
    collectible: drop.collectible || null, security: { locationCheck: requireInZone ? 'signed-proximity-proof' : 'not-required', clientDistanceIsUxOnly: true,
      ownership: 'not-granted-until-chain-confirmation' }, nextStep: 'explicit_collect_then_authoritative_chain_confirmation', serverValidation: true, storage: 'supabase' };
}

export async function markClaimSubmitted({ dropId, walletAddress, claimTicket, transactionHash } = {}) {
  const wallet = normalizeWallet(walletAddress);
  if (!claimTicket || !transactionHash) throw new Error('Claim ticket and transaction hash are required');
  const db = requireConfiguredStorage(await getSupabase());
  const { data, error } = await db.from('voxel_claims').update({ status: 'submitted', transaction_hash: transactionHash }).eq('drop_id', dropId).eq('wallet_address', wallet).eq('claim_ticket', claimTicket).eq('status', 'reserved').select('id,status').single();
  if (error || !data) throw new Error(error?.message || 'Claim reservation is not available for submission');
  return { status: data.status, dropId, walletAddress: wallet, claimTicket, transactionHash };
}

export async function markClaimConfirmed({ dropId, walletAddress, claimTicket, tokenId = null } = {}) {
  const wallet = normalizeWallet(walletAddress);
  if (!claimTicket) throw new Error('Claim ticket is required');
  const db = requireConfiguredStorage(await getSupabase());
  const { data, error } = await db.from('voxel_claims').select('id,status,transaction_hash,expires_at').eq('drop_id', dropId).eq('wallet_address', wallet).eq('claim_ticket', claimTicket).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Claim reservation not found');
  if (data.status === 'confirmed') return { status: 'confirmed', alreadyFinalized: true };
  if (data.status !== 'submitted') throw new Error('Claim must be submitted before confirmation');
  if (!data.transaction_hash) throw new Error('Transaction hash is required before confirmation');
  if (isReservationActive(data.status, data.expires_at) === false && data.status !== 'submitted') throw new Error('Claim reservation expired');

  // Chain receipt/event verification belongs here before this function is exposed to the public API.
  // This function deliberately refuses to accept tokenId as proof of ownership.
  // The next adapter will verify the actual receipt against the configured contract/network.
  const { data: confirmed, error: confirmError } = await db.from('voxel_claims').update({ status: 'confirmed', token_id: tokenId == null ? null : String(tokenId) }).eq('id', data.id).eq('status', 'submitted').select('id,status').single();
  if (confirmError || !confirmed) throw new Error(confirmError?.message || 'Claim confirmation race lost');
  return { status: 'confirmed', dropId, walletAddress: wallet, claimTicket, tokenId };
}

export async function releaseClaimReservation({ dropId, walletAddress, claimTicket } = {}) {
  const wallet = normalizeWallet(walletAddress);
  const db = requireConfiguredStorage(await getSupabase());
  const { error } = await db.from('voxel_claims').update({ status: 'released' }).eq('drop_id', dropId).eq('wallet_address', wallet).eq('claim_ticket', claimTicket).in('status', ['reserved']);
  if (error) throw new Error(error.message);
  return { released: true, dropId, walletAddress: wallet };
}

export async function saveTradeOffer(offer) {
  const db = await getSupabase();
  memory.trades.set(offer.id, offer);
  if (db) { const { error } = await db.from('voxel_trade_offers').upsert({ id: offer.id, state: offer.state, offerer: offer.offerer, recipient: offer.recipient, offered: offer.offered, requested: offer.requested, expires_at: offer.expiresAt, updated_at: new Date().toISOString() }); if (error) throw new Error(error.message); }
  return offer;
}

export async function getTradeOffer(id) {
  const db = await getSupabase();
  if (db) { const { data } = await db.from('voxel_trade_offers').select('*').eq('id', id).maybeSingle(); if (data) return { id: data.id, state: data.state, offerer: data.offerer, recipient: data.recipient, offered: data.offered, requested: data.requested, expiresAt: data.expires_at, createdAt: data.created_at }; }
  return memory.trades.get(id) || null;
}
