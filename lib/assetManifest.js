export const ASSET_CACHE_VERSION = 1;

export function createAssetManifest(collectible = {}) {
  const asset = collectible.asset || {};
  return {
    version: ASSET_CACHE_VERSION,
    collectibleId: collectible.id || null,
    fingerprint: collectible.fingerprint || null,
    modelUri: asset.uri || null,
    previewUri: asset.previewUri || asset.thumbnailUri || null,
    format: asset.format || 'glb',
    assetVersion: asset.version || 1,
    preload: Boolean(asset.uri),
    cacheKey: `voxel-vault:${collectible.id || collectible.name || 'asset'}:${asset.version || 1}`,
  };
}

export function canUseRemoteModel(manifest) {
  return Boolean(manifest?.modelUri && /^(https?:|ipfs:)/i.test(manifest.modelUri));
}
