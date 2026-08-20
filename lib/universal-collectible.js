export function createUniversalCollectible(input = {}) {
  return {
    collection: input.collection || 'Voxel Vault',
    tokenId: input.tokenId ?? null,
    name: input.name || 'Untitled 3D Collectible',
    description: input.description || '',
    metadataUri: input.metadataUri || null,
    assetUri: input.assetUri || null,
    assetType: input.assetType || 'model/gltf-binary',
    creator: input.creator || null,
    royaltyBps: Number(input.royaltyBps || 0),
    traits: Array.isArray(input.traits) ? input.traits : [],
    rarity: input.rarity || 'Common',
    material: input.material || null,
    realityBasis: input.realityBasis || null,
    edition: input.edition || null,
    version: input.version || 1,
    ownership: {
      chainId: input.chainId || null,
      contract: input.contract || null,
      owner: input.owner || null,
      standard: input.standard || 'ERC-721'
    },
    platformProfiles: Array.isArray(input.platformProfiles) ? input.platformProfiles : []
  };
}

export function getPlatformProfile(collectible, platform) {
  return (collectible?.platformProfiles || []).find((profile) => profile.platform === platform) || null;
}

export function isPortableAsset(collectible) {
  return Boolean(collectible?.assetUri && collectible?.metadataUri && collectible?.assetType);
}
