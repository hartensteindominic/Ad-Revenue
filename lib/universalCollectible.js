/**
 * Voxel Vault Universal Collectible Engine
 *
 * The NFT is the ownership layer. The collectible is the product.
 * This schema intentionally stays blockchain-agnostic so the same object can
 * power generated assets, creator uploads, drops, trading, AR and platform adapters.
 */

export const COLLECTIBLE_VERSION = '1.0.0';

export const OBJECT_FAMILIES = [
  'vehicles',
  'technology',
  'fashion',
  'sports',
  'architecture',
  'nature',
  'creatures',
  'artifacts',
  'science',
  'scifi',
  'fantasy',
  'furniture',
  'other',
];

export const CREATION_MODES = ['procedural', 'ai_assisted', 'creator_upload'];
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export function createUniversalCollectible(input = {}) {
  const family = OBJECT_FAMILIES.includes(input.family) ? input.family : 'other';
  const creationMode = CREATION_MODES.includes(input.creationMode)
    ? input.creationMode
    : 'procedural';
  const rarity = RARITIES.includes(input.rarity) ? input.rarity : 'common';

  if (!isNonEmptyString(input.name)) {
    throw new Error('Collectible name is required');
  }

  return {
    schema: 'voxel-vault/universal-collectible',
    version: COLLECTIBLE_VERSION,
    id: input.id || null,
    name: input.name.trim(),
    description: input.description?.trim() || '',
    family,
    subtype: input.subtype?.trim() || null,
    creationMode,
    seed: input.seed ?? null,
    rarity,
    traits: Array.isArray(input.traits) ? input.traits : [],
    realityBasis: {
      inspiredBy: input.realityBasis?.inspiredBy || null,
      plausibility: input.realityBasis?.plausibility || 'fictional',
      notes: input.realityBasis?.notes || '',
    },
    asset: {
      format: input.asset?.format || 'glb',
      uri: input.asset?.uri || null,
      previewUri: input.asset?.previewUri || null,
      thumbnailUri: input.asset?.thumbnailUri || null,
      version: input.asset?.version || 1,
    },
    creator: {
      address: input.creator?.address || null,
      name: input.creator?.name || null,
    },
    blockchain: {
      chainId: input.blockchain?.chainId ?? null,
      contractAddress: input.blockchain?.contractAddress || null,
      tokenId: input.blockchain?.tokenId ?? null,
      metadataUri: input.blockchain?.metadataUri || null,
    },
    ownership: {
      owner: input.ownership?.owner || null,
      status: input.ownership?.status || 'unminted',
    },
    platforms: Array.isArray(input.platforms) ? input.platforms : [],
    provenance: Array.isArray(input.provenance) ? input.provenance : [],
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function validateUniversalCollectible(collectible) {
  const errors = [];
  if (!collectible || typeof collectible !== 'object') errors.push('Collectible must be an object');
  if (collectible?.schema !== 'voxel-vault/universal-collectible') errors.push('Invalid collectible schema');
  if (!isNonEmptyString(collectible?.name)) errors.push('Missing collectible name');
  if (!OBJECT_FAMILIES.includes(collectible?.family)) errors.push('Invalid object family');
  if (!CREATION_MODES.includes(collectible?.creationMode)) errors.push('Invalid creation mode');
  if (!RARITIES.includes(collectible?.rarity)) errors.push('Invalid rarity');
  if (!collectible?.asset?.format) errors.push('Missing asset format');
  return { valid: errors.length === 0, errors };
}

export function collectibleFingerprint(collectible) {
  const stable = JSON.stringify({
    schema: collectible.schema,
    version: collectible.version,
    name: collectible.name,
    family: collectible.family,
    subtype: collectible.subtype,
    seed: collectible.seed,
    rarity: collectible.rarity,
    traits: collectible.traits,
    asset: collectible.asset,
  });

  let hash = 2166136261;
  for (let i = 0; i < stable.length; i += 1) {
    hash ^= stable.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
