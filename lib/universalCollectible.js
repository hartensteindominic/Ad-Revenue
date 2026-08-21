/**
 * Voxel Vault Universal Collectible Engine
 *
 * The NFT is the ownership layer. The collectible is the product.
 * This schema intentionally stays blockchain-agnostic so the same object can
 * power generated assets, creator uploads, drops, trading, AR and platform adapters.
 */

export const COLLECTIBLE_VERSION = '1.1.0';

export const OBJECT_FAMILIES = [
  'vehicles', 'technology', 'fashion', 'sports', 'architecture', 'nature',
  'creatures', 'artifacts', 'science', 'scifi', 'fantasy', 'furniture', 'other',
];

export const CREATION_MODES = ['procedural', 'ai_assisted', 'creator_upload'];
export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
export const ASSET_FORMATS = ['glb', 'gltf'];
export const OWNERSHIP_STATUSES = ['unminted', 'minting', 'owned', 'transferred', 'burned'];
export const SPONSOR_LABELS = ['none', 'sponsored', 'partner'];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const hash32 = (value) => {
  let h = 2166136261;
  const text = String(value);
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const mulberry32 = (seed) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const pick = (random, values) => values[Math.floor(random() * values.length)];

/**
 * Produces deterministic visual DNA from a token/seed. It intentionally uses
 * many independent dimensions so neighboring token IDs do not look alike.
 * This controls generation traits, not ownership or cryptographic identity.
 */
export function generateVisualDNA(seed, rarity = 'common', family = 'other') {
  const random = mulberry32(hash32(`${seed}:${rarity}:${family}:voxel-vault`));
  const rarityIndex = Math.max(0, RARITIES.indexOf(rarity));
  const palettes = ['obsidian', 'arctic', 'solar', 'verdant', 'violet', 'copper', 'pearl', 'midnight'];
  const finishes = ['brushed', 'polished', 'satin', 'micro-textured', 'ceramic', 'glass-metal', 'stone-metal'];
  const silhouettes = ['compact', 'balanced', 'angular', 'organic', 'monumental', 'asymmetric'];
  const accents = ['none', 'edge-light', 'inset', 'luminous-core', 'micro-lines', 'floating-detail'];
  const environments = ['studio', 'void', 'gallery', 'mist', 'orbit', 'architectural'];
  const mutationBudget = 2 + rarityIndex;
  const mutations = [];
  const mutationPool = [
    'proportion', 'surface', 'secondary-form', 'micro-detail', 'accent-placement',
    'material-response', 'environment-light', 'animation-seed', 'silhouette-cut',
  ];
  while (mutations.length < mutationBudget) {
    const candidate = pick(random, mutationPool);
    if (!mutations.includes(candidate)) mutations.push(candidate);
  }

  return {
    dnaVersion: 1,
    palette: pick(random, palettes),
    finish: pick(random, finishes),
    silhouette: pick(random, silhouettes),
    accent: pick(random, accents),
    environment: pick(random, environments),
    rotation: Number((random() * Math.PI * 2).toFixed(5)),
    scale: Number((0.9 + random() * 0.28).toFixed(4)),
    detail: Number((0.35 + random() * 0.65).toFixed(4)),
    mutationBudget,
    mutations,
    variant: Math.floor(random() * 1000000),
  };
}

export function createUniversalCollectible(input = {}) {
  const family = OBJECT_FAMILIES.includes(input.family) ? input.family : 'other';
  const creationMode = CREATION_MODES.includes(input.creationMode) ? input.creationMode : 'procedural';
  const rarity = RARITIES.includes(input.rarity) ? input.rarity : 'common';
  const assetFormat = ASSET_FORMATS.includes(input.asset?.format) ? input.asset.format : 'glb';
  const ownershipStatus = OWNERSHIP_STATUSES.includes(input.ownership?.status)
    ? input.ownership.status
    : 'unminted';
  const seed = input.seed ?? input.id ?? input.name;
  const visualDNA = input.visualDNA || generateVisualDNA(seed, rarity, family);
  const sponsorLabel = SPONSOR_LABELS.includes(input.sponsorship?.label) ? input.sponsorship.label : 'none';

  if (!isNonEmptyString(input.name)) throw new Error('Collectible name is required');

  return {
    schema: 'voxel-vault/universal-collectible',
    version: COLLECTIBLE_VERSION,
    id: input.id || null,
    name: input.name.trim(),
    description: input.description?.trim() || '',
    family,
    subtype: input.subtype?.trim() || null,
    creationMode,
    seed,
    rarity,
    visualDNA,
    traits: Array.isArray(input.traits) ? input.traits : [],
    realityBasis: {
      inspiredBy: input.realityBasis?.inspiredBy || null,
      plausibility: input.realityBasis?.plausibility || 'fictional',
      notes: input.realityBasis?.notes || '',
    },
    asset: {
      format: assetFormat,
      uri: input.asset?.uri || null,
      previewUri: input.asset?.previewUri || null,
      thumbnailUri: input.asset?.thumbnailUri || null,
      version: Number.isInteger(input.asset?.version) ? Math.max(1, input.asset.version) : 1,
    },
    creator: {
      address: input.creator?.address || null,
      name: input.creator?.name || null,
    },
    sponsorship: {
      label: sponsorLabel,
      sponsorName: sponsorLabel === 'none' ? null : (input.sponsorship?.sponsorName || null),
      disclosureText: sponsorLabel === 'none' ? null : (input.sponsorship?.disclosureText || 'Sponsored Vault Drop'),
    },
    blockchain: {
      chainId: input.blockchain?.chainId ?? null,
      contractAddress: input.blockchain?.contractAddress || null,
      tokenId: input.blockchain?.tokenId ?? null,
      metadataUri: input.blockchain?.metadataUri || null,
    },
    ownership: {
      owner: input.ownership?.owner || null,
      status: ownershipStatus,
    },
    platforms: Array.isArray(input.platforms) ? input.platforms : [],
    provenance: Array.isArray(input.provenance) ? input.provenance : [],
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function validateUniversalCollectible(collectible) {
  const errors = [];
  if (!collectible || typeof collectible !== 'object') {
    return { valid: false, errors: ['Collectible must be an object'] };
  }
  if (collectible.schema !== 'voxel-vault/universal-collectible') errors.push('Invalid collectible schema');
  if (!isNonEmptyString(collectible.name)) errors.push('Missing collectible name');
  if (!OBJECT_FAMILIES.includes(collectible.family)) errors.push('Invalid object family');
  if (!CREATION_MODES.includes(collectible.creationMode)) errors.push('Invalid creation mode');
  if (!RARITIES.includes(collectible.rarity)) errors.push('Invalid rarity');
  if (!ASSET_FORMATS.includes(collectible.asset?.format)) errors.push('Asset must be GLB or GLTF');
  if (!Number.isInteger(collectible.asset?.version) || collectible.asset.version < 1) errors.push('Invalid asset version');
  if (!OWNERSHIP_STATUSES.includes(collectible.ownership?.status)) errors.push('Invalid ownership status');
  if (collectible.sponsorship?.label && !SPONSOR_LABELS.includes(collectible.sponsorship.label)) errors.push('Invalid sponsorship label');
  if (['owned', 'transferred'].includes(collectible.ownership?.status) && !isNonEmptyString(collectible.ownership?.owner)) {
    errors.push('Owned collectibles require an owner address');
  }
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
    visualDNA: collectible?.visualDNA,
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
