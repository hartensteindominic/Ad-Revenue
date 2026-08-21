const ALLOWED = new Set(['https:', 'ipfs:']);
const MAX_URL_LENGTH = 4096;

export function isSupported3DUrl(value) {
  if (typeof value !== 'string' || value.length > MAX_URL_LENGTH) return false;
  try {
    const url = new URL(value);
    if (!ALLOWED.has(url.protocol)) return false;
    return /\.(glb|gltf)(?:$|[?#])/i.test(url.pathname) || url.protocol === 'ipfs:';
  } catch {
    return false;
  }
}

export function chooseSafeAssetUrl(primary, fallback = null) {
  return isSupported3DUrl(primary) ? primary : (isSupported3DUrl(fallback) ? fallback : null);
}
