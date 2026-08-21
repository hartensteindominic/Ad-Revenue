const STORAGE_KEY = 'voxel-vault-spots-v2';
const MAX_SPOTS = 100;

function validId(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 160;
}

export function loadVaultSpots(storage = globalThis?.localStorage) {
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.slice(0, MAX_SPOTS) : [];
  } catch {
    return [];
  }
}

export function saveVaultSpots(spots, storage = globalThis?.localStorage) {
  if (!storage) return false;
  const safe = Array.isArray(spots) ? spots.slice(0, MAX_SPOTS) : [];
  storage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return true;
}

export function attachCollectibleToSpot(spot, collectible) {
  if (!spot || !validId(spot.id) || !collectible || !validId(collectible.id)) {
    throw new Error('A valid Vault Spot and collectible are required.');
  }
  return {
    ...spot,
    collectible: {
      id: collectible.id,
      contract: collectible.contract || null,
      tokenId: collectible.tokenId ?? null,
      owner: collectible.owner || null,
      verified: Boolean(collectible.verified),
      name: collectible.name || collectible.metadata?.name || 'Voxel collectible',
      assetUrl: collectible.assetUrl || null,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function detachCollectibleFromSpot(spot) {
  if (!spot) return null;
  const next = { ...spot };
  delete next.collectible;
  next.updatedAt = new Date().toISOString();
  return next;
}

export function findSpotForCollectible(spots, collectibleId) {
  if (!validId(collectibleId)) return null;
  return (spots || []).find((spot) => spot?.collectible?.id === collectibleId) || null;
}
