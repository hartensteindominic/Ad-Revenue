export function resolveNFTMedia(item = {}) {
  const ai = item.ai?.asset || item.aiAsset || item.asset || {};
  const modelUri = firstString(ai.modelUri, item.modelUri, item.glb, item.gltf, item.assetUrl);
  const previewUri = firstString(ai.previewUri, item.previewUri, item.image, item.imageUrl, item.imageUri);
  return { modelUri, previewUri, kind: modelUri ? '3d' : previewUri ? '2d' : 'procedural', ready: Boolean(modelUri || previewUri) };
}

function firstString(...values) {
  return values.find(v => typeof v === 'string' && v.trim())?.trim() || null;
}
