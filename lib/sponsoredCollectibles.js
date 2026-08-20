// Sponsor-ready collectible primitives for Voxel Vault.
// Sponsorship is an economic/provenance layer. It never grants ownership.

const ALLOWED_CATEGORIES = new Set([
  'brand',
  'artist',
  'game',
  'music',
  'film',
  'event',
  'local-business',
  'community',
  'platform',
]);

const ALLOWED_MEDIA = new Set(['3d', '2d', 'mixed']);

const MAX_LABEL = 80;
const MAX_COPY = 280;

function cleanText(value, max = MAX_COPY) {
  return String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function safeUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:') return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function validateSponsoredCollectible(input = {}) {
  const errors = [];
  const category = cleanText(input.category, 32);
  const media = cleanText(input.media, 16);

  if (!cleanText(input.id, 96)) errors.push('id is required');
  if (!cleanText(input.title, MAX_LABEL)) errors.push('title is required');
  if (!ALLOWED_CATEGORIES.has(category)) errors.push('unsupported sponsor category');
  if (!ALLOWED_MEDIA.has(media)) errors.push('unsupported media type');
  if (!cleanText(input.sponsorName, MAX_LABEL)) errors.push('sponsorName is required');
  if (!cleanText(input.disclosure, MAX_LABEL)) errors.push('disclosure is required');
  if (input.destinationUrl && !safeUrl(input.destinationUrl)) errors.push('destinationUrl must be an HTTPS URL');

  return { valid: errors.length === 0, errors };
}

export function normalizeSponsoredCollectible(input = {}) {
  const normalized = {
    id: cleanText(input.id, 96),
    title: cleanText(input.title, MAX_LABEL),
    media: cleanText(input.media, 16),
    category: cleanText(input.category, 32),
    sponsorName: cleanText(input.sponsorName, MAX_LABEL),
    sponsorLogo: safeUrl(input.sponsorLogo),
    destinationUrl: safeUrl(input.destinationUrl),
    disclosure: cleanText(input.disclosure, MAX_LABEL) || 'Sponsored collectible',
    creator: cleanText(input.creator, MAX_LABEL),
    campaignId: cleanText(input.campaignId, 96),
    campaignStatus: cleanText(input.campaignStatus, 32) || 'draft',
    rewardText: cleanText(input.rewardText, MAX_LABEL),
    description: cleanText(input.description, MAX_COPY),
    rarity: cleanText(input.rarity, 32),
    seed: cleanText(input.seed, 120),
    contractAddress: cleanText(input.contractAddress, 64),
    chain: cleanText(input.chain, 32) || 'Sepolia',
  };

  const result = validateSponsoredCollectible(normalized);
  return result.valid ? normalized : null;
}

// These are intentionally sponsor-free concepts. They prove the UI/metadata contract
// without pretending that a real advertiser has purchased inventory.
export const SPONSOR_READY_CONCEPTS = [
  {
    id: 'sponsor-slot-3d-artifact',
    title: 'The Signal Artifact',
    media: '3d',
    category: 'platform',
    sponsorName: 'Sponsor slot available',
    disclosure: 'Sponsor-ready collectible',
    creator: 'Voxel Vault',
    campaignStatus: 'available',
    description: 'A 3D-native collectible designed to carry a disclosed campaign while remaining desirable as an object in its own right.',
    rarity: 'Rare',
    seed: 'sponsor-ready-signal-artifact',
    chain: 'Sepolia',
  },
  {
    id: 'sponsor-slot-hunt-drop',
    title: 'The Hidden Beacon',
    media: 'mixed',
    category: 'event',
    sponsorName: 'Sponsor slot available',
    disclosure: 'Sponsor-ready hunt drop',
    creator: 'Voxel Vault',
    campaignStatus: 'available',
    description: 'A hunt-native collectible that can be discovered through QR, supported BLE discovery, or future NFC enhancements before wallet authorization.',
    rarity: 'Epic',
    seed: 'sponsor-ready-hidden-beacon',
    chain: 'Sepolia',
  },
  {
    id: 'sponsor-slot-creator-collab',
    title: 'The Collaboration Token',
    media: 'mixed',
    category: 'artist',
    sponsorName: 'Sponsor slot available',
    disclosure: 'Sponsor-ready creator collaboration',
    creator: 'Creator + Voxel Vault',
    campaignStatus: 'available',
    description: 'A creator-led collectible format where campaign support funds production without changing the collector ownership model.',
    rarity: 'Legendary',
    seed: 'sponsor-ready-collaboration',
    chain: 'Sepolia',
  },
].map(normalizeSponsoredCollectible).filter(Boolean);

export function isSponsoredCollectible(item) {
  return Boolean(item?.sponsorName && item?.disclosure && item?.campaignId);
}

export function sponsorDisclosure(item) {
  if (!item) return '';
  return cleanText(item.disclosure || 'Sponsored collectible', MAX_LABEL);
}
