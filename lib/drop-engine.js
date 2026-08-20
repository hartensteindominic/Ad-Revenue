const TRAITS = {
  deck: ['Carbon Fiber', 'Maple', 'Aluminum', 'Recycled Composite'],
  wheels: ['Street 52mm', 'Cruiser 58mm', 'Glow 54mm', 'Aero 56mm'],
  finish: ['Brushed', 'Pearlescent', 'Matte', 'Holographic'],
  graphic: ['Orbit', 'Circuit', 'Topographic', 'Racing Stripe']
};

function hash(seed, index) {
  let h = 2166136261;
  const text = `${seed}:${index}`;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

function pick(values, n) {
  return values[Math.floor(n * values.length) % values.length];
}

export function generateSkateboard(seed, index = 0) {
  const a = hash(seed, index);
  const b = hash(seed, index + 1);
  const c = hash(seed, index + 2);
  const d = hash(seed, index + 3);
  const rarityRoll = hash(seed, index + 4);
  const rarity = rarityRoll > 0.995 ? 'Legendary' : rarityRoll > 0.96 ? 'Epic' : rarityRoll > 0.8 ? 'Rare' : 'Common';

  return {
    collection: 'Voxel Skateboards',
    tokenId: null,
    name: `Voxel Skateboard #${String(index + 1).padStart(4, '0')}`,
    seed,
    rarity,
    assetType: 'model/gltf-binary',
    traits: [
      { trait_type: 'Deck', value: pick(TRAITS.deck, a) },
      { trait_type: 'Wheels', value: pick(TRAITS.wheels, b) },
      { trait_type: 'Finish', value: pick(TRAITS.finish, c) },
      { trait_type: 'Graphic', value: pick(TRAITS.graphic, d) }
    ],
    realityBasis: 'Real skateboard proportions and construction with speculative materials and graphics.',
    platformProfiles: []
  };
}

export function generateDrop({ seed = crypto.randomUUID(), quantity = 10 } = {}) {
  return Array.from({ length: Math.max(1, Math.min(quantity, 10000)) }, (_, index) => generateSkateboard(seed, index));
}
