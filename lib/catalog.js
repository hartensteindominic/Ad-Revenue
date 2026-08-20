// Deterministic endless catalog generator for Voxel Vault
// Generates unique showcase items on demand without hardcoding thousands of objects.

import { availableShapes, availableMaterials } from './nft-engine';

const CREATORS = [
  'BlockGarage', 'SpatialMint', 'PixelWild', 'WorldBlocks', 'FutureFoundry',
  'OrbitWorks', 'VoxelWilds', 'VoxelGarden', 'MythForge', 'IronCircuit',
  'LightLab', 'HorizonStudio', 'StonePath', 'StreetVoltage', 'DeepSignal',
  'AtelierVault', 'FormAtelier', 'EdgeWorks', 'Wallwright', 'Mycelia',
  'SignalYard', 'Rootline', 'MagmaWorks', 'FrostArchive', 'NeonArchive',
];

const TYPES = {
  car: 'Vehicle', villa: 'Architecture', owl: 'Creature', fox: 'Creature',
  robot: 'Character', statue: 'Artifact', ship: 'Vehicle', tree: 'World',
  dragon: 'Creature', mech: 'Character', crystal: 'Artifact', portal: 'World',
  temple: 'Architecture', motorcycle: 'Vehicle', alien: 'Character',
  jewelry: 'Artifact', abstract: 'World', sword: 'Artifact',
  fortress: 'Architecture', mushroom: 'World', satellite: 'Vehicle', totem: 'Artifact',
};

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const RARITY_WEIGHTS = [28, 24, 22, 14, 8, 4]; // percentage-ish distribution

const NAME_PREFIX = {
  car: ['Midnight', 'Neon', 'Chrome', 'Shadow', 'Pulse', 'Apex'],
  villa: ['Modern', 'Glass', 'Stone', 'Sky', 'Cliff', 'Harbor'],
  owl: ['Forest', 'Night', 'Snow', 'Amber', 'Silent', 'Moon'],
  fox: ['Red', 'Arctic', 'Swift', 'Copper', 'Wild', 'Ember'],
  robot: ['Astra', 'Nova', 'Unit', 'Pulse', 'Aegis', 'Core'],
  statue: ['Marble', 'Obsidian', 'Bronze', 'Jade', 'Guardian', 'Sentinel'],
  ship: ['Deep', 'Orbit', 'Void', 'Solar', 'Cargo', 'Drift'],
  tree: ['Crystal', 'Ancient', 'Glow', 'Iron', 'Spirit', 'Root'],
  dragon: ['Obsidian', 'Storm', 'Frost', 'Ember', 'Void', 'Crown'],
  mech: ['Aegis', 'Titan', 'Iron', 'Pulse', 'Siege', 'Nova'],
  crystal: ['Prism', 'Shard', 'Facet', 'Lumen', 'Core', 'Spire'],
  portal: ['Void', 'Echo', 'Rift', 'Gate', 'Horizon', 'Fold'],
  temple: ['Sun', 'Moon', 'Stone', 'Ice', 'Sky', 'Ancestor'],
  motorcycle: ['Neon', 'Street', 'Pulse', 'Chrome', 'Night', 'Volt'],
  alien: ['Xenon', 'Visitor', 'Signal', 'Drift', 'Echo', 'Null'],
  jewelry: ['Crown', 'Relic', 'Orb', 'Band', 'Sigil', 'Gem'],
  abstract: ['Helix', 'Drift', 'Fold', 'Pulse', 'Form', 'Wave'],
  sword: ['Eclipse', 'Edge', 'Rune', 'Void', 'Dawn', 'Shard'],
  fortress: ['Bastion', 'Keep', 'Wall', 'Citadel', 'Watch', 'Iron'],
  mushroom: ['Glowcap', 'Spore', 'Mycel', 'Night', 'Root', 'Bloom'],
  satellite: ['Orbit', 'Relay', 'Signal', 'Star', 'Link', 'Array'],
  totem: ['Ancestor', 'Spirit', 'Root', 'Mark', 'Clan', 'Stone'],
};

const NAME_SUFFIX = {
  car: ['GT', 'RS', 'X', 'Prime', 'One', 'Type-S'],
  villa: ['Villa', 'House', 'Residence', 'Retreat', 'Atrium', 'Court'],
  owl: ['Owl', 'Watcher', 'Study', 'Gaze', 'Wing', 'Perch'],
  fox: ['Fox', 'Study', 'Sprint', 'Den', 'Trail', 'Howl'],
  robot: ['07', 'X1', 'Mark II', 'Unit', 'Frame', 'Core'],
  statue: ['Guardian', 'Figure', 'Form', 'Idol', 'Presence', 'Mark'],
  ship: ['Hauler', 'Runner', 'Craft', 'Vessel', 'Barque', 'Drift'],
  tree: ['Tree', 'Grove', 'Canopy', 'Spire', 'Root', 'Crown'],
  dragon: ['Dragon', 'Wyrm', 'Serpent', 'Drake', 'Wing', 'Lord'],
  mech: ['Mech', 'Frame', 'Suit', 'Walker', 'Unit', 'Shell'],
  crystal: ['Spire', 'Shard', 'Prism', 'Core', 'Column', 'Form'],
  portal: ['Gate', 'Ring', 'Rift', 'Window', 'Fold', 'Door'],
  temple: ['Temple', 'Sanctum', 'Hall', 'Shrine', 'Court', 'Peak'],
  motorcycle: ['Rider', 'Cycle', 'Bolt', 'Runner', 'Line', 'Speed'],
  alien: ['Visitor', 'Form', 'Signal', 'Being', 'Entity', 'Presence'],
  jewelry: ['Relic', 'Crown', 'Band', 'Orb', 'Sigil', 'Jewel'],
  abstract: ['Drift', 'Form', 'Study', 'Composition', 'Field', 'Object'],
  sword: ['Blade', 'Edge', 'Sword', 'Fang', 'Shard', 'Mark'],
  fortress: ['Keep', 'Bastion', 'Wall', 'Citadel', 'Hold', 'Watch'],
  mushroom: ['Grove', 'Cap', 'Cluster', 'Spore', 'Bloom', 'Ring'],
  satellite: ['Relay', 'Node', 'Array', 'Probe', 'Link', 'Beacon'],
  totem: ['Totem', 'Mark', 'Pillar', 'Sign', 'Pole', 'Idol'],
};

const COLORS = ['violet', 'blue', 'green', 'gold', 'cyan', 'pink', 'orange', 'mint'];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(arr, seed) {
  return arr[hash(String(seed)) % arr.length];
}

function weightedRarity(seed) {
  const r = hash(String(seed) + ':r') % 100;
  let acc = 0;
  for (let i = 0; i < RARITIES.length; i++) {
    acc += RARITY_WEIGHTS[i];
    if (r < acc) return RARITIES[i];
  }
  return 'Rare';
}

function priceFor(rarity, seed) {
  const base = {
    Common: 0.025, Uncommon: 0.045, Rare: 0.075,
    Epic: 0.130, Legendary: 0.210, Mythic: 0.340,
  }[rarity] || 0.08;
  const jitter = ((hash(String(seed) + ':p') % 40) - 20) / 1000;
  return (base + jitter).toFixed(3);
}

function blocksFor(rarity, seed) {
  const base = {
    Common: 900, Uncommon: 1300, Rare: 1800,
    Epic: 2600, Legendary: 3800, Mythic: 5200,
  }[rarity] || 1600;
  const jitter = hash(String(seed) + ':b') % 400;
  return (base + jitter).toLocaleString();
}

/**
 * Generate a single catalog item by index.
 * Same index always produces the same item (deterministic).
 */
export function getCatalogItem(index) {
  const id = index + 1;
  const seed = `vv-catalog-${id}`;
  const shape = availableShapes[hash(seed + ':shape') % availableShapes.length];
  const material = availableMaterials[hash(seed + ':mat') % availableMaterials.length];
  const rarity = weightedRarity(seed);
  const prefixes = NAME_PREFIX[shape] || ['Voxel'];
  const suffixes = NAME_SUFFIX[shape] || ['Form'];
  const name = `${pick(prefixes, seed + ':n1')} ${pick(suffixes, seed + ':n2')}`;
  const creator = pick(CREATORS, seed + ':c');
  const type = TYPES[shape] || 'World';
  const color = pick(COLORS, seed + ':col');

  return {
    id,
    name,
    creator,
    shape,
    material,
    type,
    rarity,
    price: priceFor(rarity, seed),
    blocks: blocksFor(rarity, seed),
    color,
    seed,
    description: `${rarity} ${material} ${type.toLowerCase()} · unique deterministic form from the Voxel Vault catalog.`,
  };
}

/**
 * Return a window of catalog items (for infinite scroll).
 * start = 0-based index, count = how many to return.
 */
export function getCatalogWindow(start = 0, count = 12) {
  const items = [];
  for (let i = start; i < start + count; i++) {
    items.push(getCatalogItem(i));
  }
  return items;
}

export const CATALOG_SIZE = 10000; // logical size of the endless vault
