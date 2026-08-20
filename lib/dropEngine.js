import { createUniversalCollectible } from './universalCollectible';

export const DROP_STATUSES = ['draft', 'scheduled', 'active', 'exhausted', 'expired', 'cancelled'];

export function createDrop(input = {}) {
  const quantity = Number.isInteger(input.quantity) ? input.quantity : 1;
  if (quantity < 1 || quantity > 10000) throw new Error('Drop quantity must be between 1 and 10,000');

  const startAt = input.startAt || null;
  const endAt = input.endAt || null;
  if (startAt && endAt && new Date(endAt) <= new Date(startAt)) {
    throw new Error('Drop endAt must be later than startAt');
  }

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
      radiusMeters: Number.isFinite(input.radiusMeters) ? Math.max(1, input.radiusMeters) : 50,
      clues: Array.isArray(input.clues) ? input.clues : [],
    },
    schedule: { startAt, endAt },
    claimRules: {
      maxClaimsPerWallet: Number.isInteger(input.maxClaimsPerWallet)
        ? Math.max(1, input.maxClaimsPerWallet)
        : 1,
      requiresWallet: input.requiresWallet !== false,
    },
    createdAt: new Date().toISOString(),
  };
}

export function isDropDiscoverable(drop, now = new Date()) {
  if (!drop || !['scheduled', 'active'].includes(drop.status)) return false;
  const current = new Date(now).getTime();
  const start = drop.schedule.startAt ? new Date(drop.schedule.startAt).getTime() : -Infinity;
  const end = drop.schedule.endAt ? new Date(drop.schedule.endAt).getTime() : Infinity;
  return current >= start && current <= end;
}

export function isWithinDropZone(drop, distanceMeters) {
  return Boolean(
    drop?.discovery &&
    Number.isFinite(distanceMeters) &&
    distanceMeters >= 0 &&
    distanceMeters <= drop.discovery.radiusMeters
  );
}

export function prepareClaim({ drop, collectible, walletAddress, distanceMeters }) {
  if (!isDropDiscoverable(drop)) throw new Error('Drop is not currently active');
  if (!isWithinDropZone(drop, distanceMeters)) throw new Error('Wallet is outside the drop zone');
  if (!walletAddress) throw new Error('Wallet connection is required');

  const base = collectible || createUniversalCollectible({
    name: `${drop.name} collectible`,
    family: 'other',
    creationMode: 'procedural',
  });

  return {
    type: 'claim-intent',
    dropId: drop.id,
    walletAddress,
    collectible: base,
    createdAt: new Date().toISOString(),
  };
}
