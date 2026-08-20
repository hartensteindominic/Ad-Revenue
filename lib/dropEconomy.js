export const DROP_POOL_BPS_CAP = 5000;

export function validateDropEconomyConfig(input = {}) {
  const marketplaceFeeBps = Number(input.marketplaceFeeBps ?? 250);
  const dropPoolBps = Number(input.dropPoolBps ?? 1000);
  if (!Number.isInteger(marketplaceFeeBps) || marketplaceFeeBps < 0 || marketplaceFeeBps > 1000) {
    throw new Error('Marketplace fee must be an integer between 0 and 1000 bps.');
  }
  if (!Number.isInteger(dropPoolBps) || dropPoolBps < 0 || dropPoolBps > DROP_POOL_BPS_CAP) {
    throw new Error('Drop Pool allocation must be an integer between 0 and 5000 bps.');
  }
  return { marketplaceFeeBps, dropPoolBps };
}

export function calculateDropPoolAllocation(platformFeeWei, dropPoolBps) {
  const fee = BigInt(platformFeeWei);
  const bps = BigInt(dropPoolBps);
  if (fee < 0n || bps < 0n || bps > 10000n) throw new Error('Invalid Drop Pool calculation.');
  return (fee * bps) / 10000n;
}

export function createDrop(input = {}) {
  if (!input.id || !input.name) throw new Error('Drop id and name are required.');
  return {
    id: String(input.id),
    name: String(input.name),
    collectibleId: input.collectibleId ? String(input.collectibleId) : null,
    creator: input.creator ? String(input.creator) : 'voxel-vault',
    status: input.status || 'scheduled',
    radiusMeters: Number.isFinite(Number(input.radiusMeters)) ? Number(input.radiusMeters) : null,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    fundedBy: input.fundedBy || 'platform',
    poolAllocationWei: String(input.poolAllocationWei ?? '0'),
  };
}
