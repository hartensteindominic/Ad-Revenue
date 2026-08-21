const HTTP_URL = /^https?:\/\//i;
const IPFS_URL = /^ipfs:\/\//i;
const MAX_METADATA_BYTES = 512 * 1024;

export function normalizeTokenUri(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const value = uri.trim();
  if (HTTP_URL.test(value)) return value;
  if (IPFS_URL.test(value)) return `https://ipfs.io/ipfs/${value.slice(7).replace(/^\/+/, '')}`;
  if (value.startsWith('data:application/json;base64,')) return value;
  return null;
}

export function extractAssetUrl(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  const candidates = [metadata.animation_url, metadata.external_url, metadata.glb, metadata.asset_url, metadata.model_url];
  const file = Array.isArray(metadata.files) ? metadata.files.find((item) => /glb|gltf/i.test(item?.type || item?.uri || '')) : null;
  const value = candidates.find((item) => typeof item === 'string' && (HTTP_URL.test(item) || IPFS_URL.test(item))) || file?.uri;
  return normalizeTokenUri(value);
}

export async function fetchMetadata(tokenUri, signal) {
  const normalized = normalizeTokenUri(tokenUri);
  if (!normalized) throw new Error('Unsupported token metadata URI.');
  if (normalized.startsWith('data:')) {
    const encoded = normalized.split(',', 2)[1];
    const text = atob(encoded);
    if (text.length > MAX_METADATA_BYTES) throw new Error('Metadata is too large.');
    return JSON.parse(text);
  }
  const response = await fetch(normalized, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Metadata request failed (${response.status}).`);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_METADATA_BYTES) throw new Error('Metadata is too large.');
  const text = await response.text();
  if (text.length > MAX_METADATA_BYTES) throw new Error('Metadata is too large.');
  return JSON.parse(text);
}
