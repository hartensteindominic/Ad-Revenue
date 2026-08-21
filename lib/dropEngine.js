import { createUniversalCollectible } from './universalCollectible.js';

export const DROP_STATUSES = ['draft', 'scheduled', 'active', 'exhausted', 'expired', 'cancelled'];

function parseDate(value, label) {
  if (value === null || value === undefined || value === '') return null;
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) throw new Error(`${label} must be a valid date`);
  return new Date(time).toISOString();
}

function normalizeWallet(address) {
  if (typeof address !== 'string' || !address.trim()) throw new Error('Wallet connection is required');
  return address.trim().toLowerCase();
}

export function createDrop(input = {}) {
  const quantity = Number.isInteger(input.quantity) ? input.quantity : 1;
  if (quantity < 1 || quantity > 10000) throw new Error('Drop quantity must be between 1 and 10,000');

  const startAt = parseDate(input.startAt, 'Drop startAt');
  const endAt = parseDate(input.endAt, 'Drop endAt');
  if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
    throw new Error('Drop endAt must be later than startAt');
  }

  const radiusMeters = Number.isFinite(input.radiusMeters) ? Math.max(1, input.radiusMeters) : 50;
  const maxClaimsPerWallet = Number.isInteger(input.maxClaimsPerWallet)
    ? Math.max(1, input.maxClaimsPerWallet)
    : 1;

  return {
    schema: 'voxel-vault/drop',
    version: '1.0.0',
    id: input.id || null,
    name: input.name?.trim() || 'Untitled Voxel Drop',
    status: input.status && DROP_STATUSES.includes(input.status) ? input.status : 'draft',
    quantity,
    collectionId: input.collectionId || null,
    discovery: {
      publicZoneId: input.publicZoneId || null,
      radiusMeters,
      clues: Array.isArray(input.clues) ? [...input.clues] : [],
    },
    schedule: { startAt, endAt },
    claimRules: {
      maxClaimsPerWallet,
      requiresWallet: input.requiresWallet !== false,
    },
    createdAt: new Date().toISOString(),
  };
}

export function isDropDiscoverable(drop, now = new Date()) {
  if (!drop || !['scheduled', 'active'].includes(drop.status)) return false;
  const current = new Date(now).getTime();
  if (!Number.isFinite(current)) return false;
  const start = drop.schedule?.startAt ? new Date(drop.schedule.startAt).getTime() : -Infinity;
  const end = drop.schedule?.endAt ? new Date(drop.schedule.endAt).getTime() : Infinity;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  return current >= start && current <= end;
}

export function isWithinDropZone(drop, distanceMeters) {
  return Boolean(
    drop?.discovery &&
    Number.isFinite(distanceMeters) &&
    distanceMeters >= 0 &&
    Number.isFinite(drop.discovery.radiusMeters) &&
    distanceMeters <= drop.discovery.radiusMeters
  );
}

export function prepareClaim({ drop, collectible, walletAddress, distanceMeters } = {}) {
  if (!isDropDiscoverable(drop)) throw new Error('Drop is not currently active');
  if (!isWithinDropZone(drop, distanceMeters)) throw new Error('Claim location is outside the public drop zone');
  const normalizedWallet = normalizeWallet(walletAddress);

  const base = collectible || createUniversalCollectible({
    name: `${drop.name} collectible`,
    family: 'other',
    creationMode: 'procedural',
  });

  return {
    schema: 'voxel-vault/claim-intent',
    version: '1.0.0',
    type: 'claim-intent',
    dropId: drop.id,
    walletAddress: normalizedWallet,
    collectible: base,
    createdAt: new Date().toISOString(),
    security: {
      locationCheck: 'client-supplied-distance-is-UX-only',
      serverValidationRequired: true,
      replayProtectionRequired: true,
    },
  };
}
