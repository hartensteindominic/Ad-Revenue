export function resolveNFTMedia(item = {}) {
  const ai = item.ai?.asset || item.aiAsset || item.asset || {};
  const modelUri = firstString(ai.modelUri, item.modelUri, item.glb, item.gltf, item.assetUrl);
  const previewUri = firstString(ai.previewUri, item.previewUri, item.image, item.imageUrl, item.imageUri);

  // Every canonical collectible gets a 3D representation. When a verified/licensed
  // GLB/GLTF is unavailable, the client uses its deterministic procedural digital twin.
  // This keeps the NFT experience 3D without pretending a generated twin is an exact scan.
  return {
    modelUri,
    previewUri,
    kind: modelUri ? '3d-model' : '3d-twin',
    ready: Boolean(modelUri || previewUri),
    has3DTwin: true,
  };
}

function firstString(...values) {
  return values.find(v => typeof v === 'string' && v.trim())?.trim() || null;
}
