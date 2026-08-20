const ALLOWED_ASSET_FORMATS = new Set(["GLB/GLTF"]);
const VALID_RARITIES = new Set(["common", "uncommon", "rare", "epic", "legendary"]);

export function validateUniversalCollectible(collectible) {
  const errors = [];

  if (!collectible || typeof collectible !== "object") {
    return { valid: false, errors: ["Collectible must be an object."] };
  }

  if (collectible.schema !== "voxel-universal-collectible/v1") {
    errors.push("Unsupported collectible schema.");
  }

  if (!collectible.id) errors.push("Collectible ID is required.");
  if (!collectible.seed) errors.push("Deterministic seed is required.");
  if (!collectible.category) errors.push("Collectible category is required.");
  if (!VALID_RARITIES.has(collectible.rarity)) errors.push("Invalid rarity.");

  if (!collectible.asset || !ALLOWED_ASSET_FORMATS.has(collectible.asset.format)) {
    errors.push("A GLB/GLTF asset declaration is required.");
  }

  if (collectible.ownership?.status === "verified") {
    if (!collectible.ownership.chain) errors.push("Verified ownership requires a chain.");
    if (!collectible.ownership.contract) errors.push("Verified ownership requires a contract.");
    if (!collectible.ownership.tokenId) errors.push("Verified ownership requires a token ID.");
    if (!collectible.ownership.owner) errors.push("Verified ownership requires an owner.");
  }

  return { valid: errors.length === 0, errors };
}
