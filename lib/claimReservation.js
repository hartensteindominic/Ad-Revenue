/**
 * Durable claim reservation primitives.
 *
 * Production rule: durable storage is required. In-memory state is intentionally
 * not used for reservation authority because multiple instances must agree.
 */

const DEFAULT_TTL_SECONDS = 120;
const ACTIVE_STATUSES = ['reserved', 'authorized', 'submitted'];

export function reservationExpiresAt(now = Date.now(), ttlSeconds = DEFAULT_TTL_SECONDS) {
  const ttl = Number(ttlSeconds);
  if (!Number.isFinite(ttl) || ttl <= 0 || ttl > 15 * 60) throw new Error('Invalid reservation TTL');
  return new Date(now + ttl * 1000).toISOString();
}

export function isReservationActive(status, expiresAt, now = Date.now()) {
  return ACTIVE_STATUSES.includes(status) && Boolean(expiresAt) && new Date(expiresAt).getTime() > now;
}

export function assertProductionStorage(db) {
  if (!db) throw new Error('Durable claim storage is required');
}

export { ACTIVE_STATUSES, DEFAULT_TTL_SECONDS };
