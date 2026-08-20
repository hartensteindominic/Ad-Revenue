/**
 * Voxel Vault Universal Collectible Engine
 *
 * Category-agnostic foundation for realistic, varied 3D collectibles.
 * This layer describes collectible identity and generation rules without
 * pretending that an asset is minted or owned until blockchain state confirms it.
 */

export const COLLECTIBLE_CATEGORIES = [
  "vehicles",
  "technology",
  "fashion",
  "sports",
  "architecture",
  "nature",
  "creatures",
  "artifacts",
  "sci-fi",
  "fantasy",
  "objects",
];

export const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

const CATEGORY_RULES = {
  vehicles: ["cars", "motorcycles", "aircraft", "boats", "spacecraft"],
  technology: ["cameras", "computers", "consoles", "robots", "drones", "instruments"],
  fashion: ["sneakers", "watches", "bags", "accessories"],
  sports: ["skateboards", "bicycles", "boards", "equipment"],
  architecture: ["buildings", "structures", "rooms", "monuments"],
  nature: ["plants", "trees", "rocks", "crystals", "natural-forms"],
  creatures: ["animals", "mythical-creatures", "speculative-life"],
  artifacts: ["tools", "sculptures", "relics", "collectibles"],
  "sci-fi": ["probes", "machines", "stations", "future-vehicles"],
  fantasy: ["artifacts", "creatures", "structures", "props"],
  objects: ["furniture", "household", "industrial", "miscellaneous"],
};

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashString(String(seed)) || 1;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(values, random) {
  return values[Math.floor(random() * values.length)];
}

function rarityFromRoll(roll) {
  if (roll < 0.01) return "legendary";
  if (roll < 0.05) return "epic";
  if (roll < 0.16) return "rare";
  if (roll < 0.36) return "uncommon";
  return "common";
}

export function getGenerationRules(category) {
  if (!CATEGORY_RULES[category]) {
    throw new Error(`Unsupported collectible category: ${category}`);
  }
  return [...CATEGORY_RULES[category]];
}

export function createUniversalCollectible({
  seed,
  category = "objects",
  index = 1,
  name,
  assetUri = null,
  previewUri = null,
  creator = null,
}) {
  if (!seed) throw new Error("A deterministic seed is required.");
  if (!COLLECTIBLE_CATEGORIES.includes(category)) {
    throw new Error(`Unsupported collectible category: ${category}`);
  }

  const random = seededRandom(`${seed}:${category}:${index}`);
  const subtype = pick(CATEGORY_RULES[category], random);
  const rarity = rarityFromRoll(random());

  return {
    schema: "voxel-universal-collectible/v1",
    id: `${category}-${index}-${hashString(`${seed}:${category}:${index}`).toString(16)}`,
    seed: String(seed),
    index,
    name: name || `${subtype.replaceAll("-", " ")} #${String(index).padStart(4, "0")}`,
    category,
    subtype,
    rarity,
    traits: {
      generationMode: "deterministic",
      realityBasis: "real-world-inspired",
    },
    asset: {
      format: "GLB/GLTF",
      assetUri,
      previewUri,
    },
    ownership: {
      status: "unverified",
      chain: null,
      contract: null,
      tokenId: null,
      owner: null,
    },
    creator,
    provenance: {
      generator: "voxel-vault-universal-engine",
      generatorVersion: "1.0.0",
    },
  };
}

export function generateCollection({
  seed,
  quantity = 10,
  categories = COLLECTIBLE_CATEGORIES,
  creator = null,
}) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    throw new Error("Collection quantity must be an integer from 1 to 10,000.");
  }

  const allowed = categories.filter((category) => COLLECTIBLE_CATEGORIES.includes(category));
  if (!allowed.length) throw new Error("At least one valid category is required.");

  return Array.from({ length: quantity }, (_, offset) => {
    const category = allowed[offset % allowed.length];
    return createUniversalCollectible({
      seed,
      category,
      index: offset + 1,
      creator,
    });
  });
}
