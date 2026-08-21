const families = ['creature', 'vehicle', 'artifact', 'architecture', 'nature', 'robot', 'character', 'cosmic'];
const materials = ['crystal', 'obsidian', 'pearl', 'titanium', 'amber', 'ceramic', 'glass', 'moonstone'];
const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const creators = ['Voxel Vault', 'WorldBlocks', 'FutureFoundry', 'Rootline', 'OrbitWorks', 'Mycelia', 'PixelWild', 'HorizonStudio'];
const names = [
  'Aurora Warden','Cinder Runner','Glass Leviathan','Moon Orchard','Obsidian Kite','Signal Bloom',
  'Axiom Fox','Prism Bastion','Velvet Comet','Copper Oracle','Rainmaker Core','Starling Engine',
  'Frost Cathedral','Moss Titan','Solar Finch','Echo Reliquary','Neon Atlas','Tidal Sentinel',
  'Lumen Garden','Void Cartographer','Amber Colossus','Quantum Moth','Cloudbreaker','Night Archive',
  'Radiant Rover','Crystal Nomad','Deepwater Shrine','Astra Courier','Wild Circuit','Silent Monolith',
  'Orbiting Bloom','Ember Knight','Pearl Machine','Sky Foundry','Hidden Sun','Vector Dragon'
];

function hash(seed) {
  let h = 2166136261;
  for (const char of String(seed)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function pick(list, seed, offset = 0) { return list[(hash(`${seed}:${offset}`) % list.length)]; }
function price(seed, rarity) {
  const base = { Common: 0.012, Uncommon: 0.026, Rare: 0.061, Epic: 0.117, Legendary: 0.198, Mythic: 0.322 }[rarity];
  const jitter = (hash(`${seed}:price`) % 35) / 1000;
  return (base + jitter).toFixed(3);
}

export const NFT_WORLD_CATALOG = Object.freeze(names.map((name, index) => {
  const seed = `world-${index + 100}-${name.toLowerCase().replaceAll(' ', '-')}`;
  const rarity = pick(rarities, seed, 1);
  const family = pick(families, seed, 2);
  return Object.freeze({
    id: index + 100,
    seed,
    name,
    rarity,
    family,
    material: pick(materials, seed, 3),
    creator: pick(creators, seed, 4),
    price: price(seed, rarity),
    sponsored: index % 9 === 0,
    sponsorLabel: index % 9 === 0 ? 'Sponsored Discovery' : null,
    disclosure: index % 9 === 0 ? 'Sponsored collectible' : null,
    renderMode: index % 5 === 0 ? 'hybrid' : 'voxel',
    mission: ['rotate', 'inspect', 'discover', 'travel', 'solve'][hash(`${seed}:mission`) % 5],
  });
}));

export function getNFTWorldCatalog({ family, rarity, sponsored } = {}) {
  return NFT_WORLD_CATALOG.filter((item) => (!family || item.family === family) && (!rarity || item.rarity === rarity) && (sponsored === undefined || item.sponsored === sponsored));
}

export function getNFTById(id) {
  return NFT_WORLD_CATALOG.find((item) => item.id === Number(id)) || null;
}
