import { createHash, randomBytes } from 'node:crypto';
import { verifyProximityProof } from './proximityProof.js';
import { assertProductionStorage, reservationExpiresAt, DEFAULT_TTL_SECONDS } from './claimReservation.js';

let supabase = null;
let tried = false;
async function db() {
  if (tried) return supabase;
  tried = true;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  } catch {}
  return supabase;
}
function wallet(value) {
  if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(value)) throw new Error('Valid wallet address is required');
  return value.toLowerCase();
}
function ticket(dropId, address) {
  return `vvclaim_${createHash('sha256').update(`${dropId}:${address}:${randomBytes(16).toString('hex')}:${Date.now()}`).digest('hex').slice(0,40)}`;
}

export async function reserveAuthoritativeClaim({ dropId, walletAddress, proximityProof, distanceMeters = null, ttlSeconds = DEFAULT_TTL_SECONDS }) {
  const address = wallet(walletAddress);
  const proximity = verifyProximityProof(proximityProof, address, dropId);
  if (!proximity.valid) throw new Error(`Proximity proof rejected: ${proximity.reason}`);
  const database = await db();
  assertProductionStorage(database);
  const expiresAt = reservationExpiresAt(Date.now(), ttlSeconds);
  const claimTicket = ticket(dropId, address);
  const { data, error } = await database.rpc('reserve_voxel_claim', {
    p_drop_id: dropId,
    p_wallet_address: address,
    p_claim_ticket: claimTicket,
    p_expires_at: expiresAt,
    p_client_distance_meters: Number.isFinite(Number(distanceMeters)) ? Number(distanceMeters) : null,
  });
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) throw new Error('Reservation failed');
  return {
    authorized: row.status === 'reserved',
    reason: row.status === 'confirmed' ? 'already_claimed' : row.status === 'submitted' ? 'claim_submitted' : row.claim_ticket === claimTicket ? null : 'claim_reserved',
    claimTicket: row.claim_ticket,
    dropId,
    walletAddress: address,
    status: row.status,
    expiresAt: row.expires_at,
    storage: 'supabase',
    serverValidation: true,
    security: { locationCheck: 'signed-proximity-proof', clientDistanceIsUxOnly: true, ownership: 'not-granted-until-chain-confirmation' },
  };
}

export async function submitAuthoritativeClaim({ dropId, walletAddress, claimTicket, transactionHash }) {
  const address = wallet(walletAddress);
  if (!/^0x[0-9a-fA-F]{64}$/.test(String(transactionHash || ''))) throw new Error('Invalid transaction hash');
  const database = await db();
  assertProductionStorage(database);
  const { data, error } = await database.from('voxel_claims').update({ status: 'submitted', transaction_hash: transactionHash })
    .eq('drop_id', dropId).eq('wallet_address', address).eq('claim_ticket', claimTicket).eq('status', 'reserved')
    .select('id,status,transaction_hash').maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Claim reservation is not available for submission');
  return { status: data.status, claimId: data.id, transactionHash: data.transaction_hash, dropId, walletAddress: address, claimTicket };
}

export async function confirmAuthoritativeClaim({ dropId, walletAddress, claimTicket, transactionHash }) {
  const address = wallet(walletAddress);
  const database = await db();
  assertProductionStorage(database);
  const { data: claim, error: claimError } = await database.from('voxel_claims').select('id,status,transaction_hash,token_id')
    .eq('drop_id', dropId).eq('wallet_address', address).eq('claim_ticket', claimTicket).maybeSingle();
  if (claimError) throw new Error(claimError.message);
  if (!claim) throw new Error('Claim reservation not found');
  if (claim.status === 'confirmed') return { status: 'confirmed', alreadyFinalized: true, tokenId: claim.token_id };
  if (claim.status !== 'submitted') throw new Error('Claim must be submitted before confirmation');
  if (claim.transaction_hash !== transactionHash) throw new Error('Transaction hash does not match the submitted claim');

  const { data, error } = await database.rpc('confirm_voxel_claim', { p_claim_id: claim.id, p_token_id: null });
  if (error) throw new Error(error.message);
  return { status: 'confirmed', dropId, walletAddress: address, claimTicket, transactionHash, confirmation: data?.[0] || null };
}
