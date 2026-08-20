/**
 * Voxel Vault Universal Collectible Engine
 *
 * The NFT is the ownership layer. The collectible is the product.
 * The schema is intentionally blockchain-agnostic so the same object can power
 * generated assets, creator uploads, drops, trading, AR and platform adapters.
 *
 * Trust rule: user-controlled metadata is untrusted input. Bounds here prevent
 * oversized payloads from becoming a cheap memory/DB/serialization attack.
 */

export const COLLECTIBLE_VERSION = '1.0.0';

export const OBJECT_FAMILIES = [
  'vehicles', 'technology', 'fashion', 'sports', 'architecture', 'nature',
  'creatures', 'artifacts', 'science', 'scifi', 'fantasy', 'furniture', 'other',
];
export const CREATION_MODES = ['procedural', 'ai_assisted', 'creator_upload'];
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
export const ASSET_FORMATS = ['glb', 'gltf'];
export const OWNERSHIP_STATUSES = ['unminted', 'minting', 'owned', 'transferred', 'burned'];

const LIMITS = Object.freeze({
  name: 160,
  description: 4000,
  subtype: 80,
  seed: 256,
  traitCount: 64,
  traitString: 256,
  provenanceCount: 64,
  platformCount: 32,
  uri: 2048,
  notes: 1000,
});

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const boundedString = (value, max, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim().slice(0, max);
};
const boundedList = (value, max) => Array.isArray(value) ? value.slice(0, max) : [];
const safeUri = (value) => boundedString(value, LIMITS.uri, null);

export function createUniversalCollectible(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Collectible input must be an object');
  }

  const family = OBJECT_FAMILIES.includes(input.family) ? input.family : 'other';
  const creationMode = CREATION_MODES.includes(input.creationMode) ? input.creationMode : 'procedural';
  const rarity = RARITIES.includes(input.rarity) ? input.rarity : 'common';
  const assetFormat = ASSET_FORMATS.includes(input.asset?.format) ? input.asset.format : 'glb';
  const ownershipStatus = OWNERSHIP_STATUSES.includes(input.ownership?.status)
    ? input.ownership.status
    : 'unminted';

  if (!isNonEmptyString(input.name) || input.name.trim().length > LIMITS.name) {
    throw new Error(`Collectible name is required and must be <= ${LIMITS.name} characters`);
  }

  const traits = boundedList(input.traits, LIMITS.traitCount).map((trait) => {
    if (!trait || typeof trait !== 'object' || Array.isArray(trait)) return { trait_type: 'invalid', value: '' };
    return {
      trait_type: boundedString(trait.trait_type, LIMITS.traitString),
      value: boundedString(trait.value, LIMITS.traitString),
    };
  });

  const provenance = boundedList(input.provenance, LIMITS.provenanceCount).map((entry) => boundedString(entry, LIMITS.notes));
  const platforms = boundedList(input.platforms, LIMITS.platformCount).map((entry) => boundedString(entry, LIMITS.traitString));

  return {
    schema: 'voxel-vault/universal-collectible',
    version: COLLECTIBLE_VERSION,
    id: boundedString(input.id, 128, null),
    name: input.name.trim(),
    description: boundedString(input.description, LIMITS.description),
    family,
    subtype: boundedString(input.subtype, LIMITS.subtype, null),
    creationMode,
    seed: boundedString(input.seed, LIMITS.seed, null),
    rarity,
    traits,
    realityBasis: {
      inspiredBy: boundedString(input.realityBasis?.inspiredBy, LIMITS.traitString, null),
      plausibility: boundedString(input.realityBasis?.plausibility, LIMITS.traitString, 'fictional'),
      notes: boundedString(input.realityBasis?.notes, LIMITS.notes),
    },
    asset: {
      format: assetFormat,
      uri: safeUri(input.asset?.uri),
      previewUri: safeUri(input.asset?.previewUri),
      thumbnailUri: safeUri(input.asset?.thumbnailUri),
      version: Number.isInteger(input.asset?.version) ? Math.max(1, Math.min(100000, input.asset.version)) : 1,
    },
    creator: {
      address: boundedString(input.creator?.address, 128, null),
      name: boundedString(input.creator?.name, 160, null),
    },
    blockchain: {
      chainId: input.blockchain?.chainId ?? null,
      contractAddress: boundedString(input.blockchain?.contractAddress, 128, null),
      tokenId: input.blockchain?.tokenId ?? null,
      metadataUri: safeUri(input.blockchain?.metadataUri),
    },
    ownership: {
      owner: boundedString(input.ownership?.owner, 128, null),
      status: ownershipStatus,
    },
    platforms,
    provenance,
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function validateUniversalCollectible(collectible) {
  const errors = [];
  if (!collectible || typeof collectible !== 'object' || Array.isArray(collectible)) {
    return { valid: false, errors: ['Collectible must be an object'] };
  }
  if (collectible.schema !== 'voxel-vault/universal-collectible') errors.push('Invalid collectible schema');
  if (!isNonEmptyString(collectible.name) || collectible.name.length > LIMITS.name) errors.push('Invalid collectible name');
  if (!OBJECT_FAMILIES.includes(collectible.family)) errors.push('Invalid object family');
  if (!CREATION_MODES.includes(collectible.creationMode)) errors.push('Invalid creation mode');
  if (!RARITIES.includes(collectible.rarity)) errors.push('Invalid rarity');
  if (!ASSET_FORMATS.includes(collectible.asset?.format)) errors.push('Asset must be GLB or GLTF');
  if (!Number.isInteger(collectible.asset?.version) || collectible.asset.version < 1 || collectible.asset.version > 100000) errors.push('Invalid asset version');
  if (!OWNERSHIP_STATUSES.includes(collectible.ownership?.status)) errors.push('Invalid ownership status');
  if (['owned', 'transferred'].includes(collectible.ownership?.status) && !isNonEmptyString(collectible.ownership?.owner)) {
    errors.push('Owned collectibles require an owner address');
  }
  if (!Array.isArray(collectible.traits) || collectible.traits.length > LIMITS.traitCount) errors.push('Too many traits');
  if (!Array.isArray(collectible.provenance) || collectible.provenance.length > LIMITS.provenanceCount) errors.push('Too much provenance');
  if (collectible.blockchain?.chainId !== null && collectible.blockchain?.chainId !== undefined) {
    try { if (BigInt(collectible.blockchain.chainId) < 0n) errors.push('Invalid blockchain chain ID'); } catch { errors.push('Invalid blockchain chain ID'); }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Deterministic display fingerprint. This is a UI/cache identity, not a
 * cryptographic substitute for a contract address, token ID, or content hash.
 */
export function collectibleFingerprint(collectible) {
  const stable = JSON.stringify({
    schema: collectible?.schema,
    version: collectible?.version,
    name: collectible?.name,
    family: collectible?.family,
    subtype: collectible?.subtype,
    seed: collectible?.seed,
    rarity: collectible?.rarity,
    traits: collectible?.traits,
    asset: collectible?.asset,
  });
  let h1 = 2166136261;
  let h2 = 16777619;
  for (let i = 0; i < stable.length; i += 1) {
    const code = stable.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 16777619);
    h2 ^= code + i;
    h2 = Math.imul(h2, 2246822519);
  }
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`;
}
