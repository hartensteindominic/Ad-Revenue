const ALLOWED_TYPES = new Set(['glb', 'gltf', 'png', 'jpg', 'jpeg', 'webp']);

export function normalizeAIAssetResult(result = {}) {
  const modelUri = typeof result.modelUri === 'string' ? result.modelUri : typeof result.glb === 'string' ? result.glb : null;
  const previewUri = typeof result.previewUri === 'string' ? result.previewUri : typeof result.imageUri === 'string' ? result.imageUri : null;
  const type = String(result.type || (modelUri ? 'glb' : previewUri ? 'webp' : '')).toLowerCase();
  if (type && !ALLOWED_TYPES.has(type)) throw new Error('Unsupported AI asset type');
  return {
    modelUri,
    previewUri,
    type: type || null,
    fingerprint: typeof result.fingerprint === 'string' ? result.fingerprint.slice(0, 160) : null,
    title: typeof result.title === 'string' ? result.title.slice(0, 160) : null,
    traits: Array.isArray(result.traits) ? result.traits.slice(0, 40) : [],
    quality: result.quality && typeof result.quality === 'object' ? result.quality : null,
  };
}
