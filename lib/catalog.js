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

const STYLES = ['Voxel', 'Sculpted', 'Stylized', 'Metallic', 'Organic', 'Crystal', 'Architectural', 'Surreal'];

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'];
const RARITY_WEIGHTS = [28, 24, 22, 14, 8, 4];

const NAME_PREFIX = {
  car: ['Midnight', 'Neon', 'Chrome', 'Shadow', 'Pulse', 'Apex', 'Solar', 'Ghost'],
  villa: ['Modern', 'Glass', 'Stone', 'Sky', 'Cliff', 'Harbor', 'Aether', 'Lumen'],
  owl: ['Forest', 'Night', 'Snow', 'Amber', 'Silent', 'Moon', 'Ash', 'Ivory'],
  fox: ['Red', 'Arctic', 'Swift', 'Copper', 'Wild', 'Ember', 'Silver', 'Dust'],
  robot: ['Astra', 'Nova', 'Unit', 'Pulse', 'Aegis', 'Core', 'Signal', 'Frame'],
  statue: ['Marble', 'Obsidian', 'Bronze', 'Jade', 'Guardian', 'Sentinel', 'Basalt', 'Ivory'],
  ship: ['Deep', 'Orbit', 'Void', 'Solar', 'Cargo', 'Drift', 'Eclipse', 'Nova'],
  tree: ['Crystal', 'Ancient', 'Glow', 'Iron', 'Spirit', 'Root', 'Lumen', 'Ash'],
  dragon: ['Obsidian', 'Storm', 'Frost', 'Ember', 'Void', 'Crown', 'Ashen', 'Lumen'],
  mech: ['Aegis', 'Titan', 'Iron', 'Pulse', 'Siege', 'Nova', 'Bastion', 'Core'],
  crystal: ['Prism', 'Shard', 'Facet', 'Lumen', 'Core', 'Spire', 'Echo', 'Rift'],
  portal: ['Void', 'Echo', 'Rift', 'Gate', 'Horizon', 'Fold', 'Mirror', 'Null'],
  temple: ['Sun', 'Moon', 'Stone', 'Ice', 'Sky', 'Ancestor', 'Aether', 'Root'],
  motorcycle: ['Neon', 'Street', 'Pulse', 'Chrome', 'Night', 'Volt', 'Ghost', 'Apex'],
  alien: ['Xenon', 'Visitor', 'Signal', 'Drift', 'Echo', 'Null', 'Rift', 'Form'],
  jewelry: ['Crown', 'Relic', 'Orb', 'Band', 'Sigil', 'Gem', 'Halo', 'Mark'],
  abstract: ['Helix', 'Drift', 'Fold', 'Pulse', 'Form', 'Wave', 'Field', 'Echo'],
  sword: ['Eclipse', 'Edge', 'Rune', 'Void', 'Dawn', 'Shard', 'Fang', 'Mark'],
  fortress: ['Bastion', 'Keep', 'Wall', 'Citadel', 'Watch', 'Iron', 'Stone', 'Aegis'],
  mushroom: ['Glowcap', 'Spore', 'Mycel', 'Night', 'Root', 'Bloom', 'Lumen', 'Ash'],
  satellite: ['Orbit', 'Relay', 'Signal', 'Star', 'Link', 'Array', 'Probe', 'Node'],
  totem: ['Ancestor', 'Spirit', 'Root', 'Mark', 'Clan', 'Stone', 'Ash', 'Bone'],
};

const NAME_SUFFIX = {
  car: ['GT', 'RS', 'X', 'Prime', 'One', 'Type-S', 'XR', 'Zero'],
  villa: ['Villa', 'House', 'Residence', 'Retreat', 'Atrium', 'Court', 'Hall', 'Nest'],
  owl: ['Owl', 'Watcher', 'Study', 'Gaze', 'Wing', 'Perch', 'Sight', 'Form'],
  fox: ['Fox', 'Study', 'Sprint', 'Den', 'Trail', 'Howl', 'Form', 'Mark'],
  robot: ['07', 'X1', 'Mark II', 'Unit', 'Frame', 'Core', 'Prime', 'Zero'],
  statue: ['Guardian', 'Figure', 'Form', 'Idol', 'Presence', 'Mark', 'Sentinel', 'Study'],
  ship: ['Hauler', 'Runner', 'Craft', 'Vessel', 'Barque', 'Drift', 'Probe', 'Ark'],
  tree: ['Tree', 'Grove', 'Canopy', 'Spire', 'Root', 'Crown', 'Form', 'Study'],
  dragon: ['Dragon', 'Wyrm', 'Serpent', 'Drake', 'Wing', 'Lord', 'Form', 'Mark'],
  mech: ['Mech', 'Frame', 'Suit', 'Walker', 'Unit', 'Shell', 'Prime', 'Core'],
  crystal: ['Spire', 'Shard', 'Prism', 'Core', 'Column', 'Form', 'Study', 'Mark'],
  portal: ['Gate', 'Ring', 'Rift', 'Window', 'Fold', 'Door', 'Mirror', 'Null'],
  temple: ['Temple', 'Sanctum', 'Hall', 'Shrine', 'Court', 'Peak', 'Nest', 'Mark'],
  motorcycle: ['Rider', 'Cycle', 'Bolt', 'Runner', 'Line', 'Speed', 'XR', 'Zero'],
  alien: ['Visitor', 'Form', 'Signal', 'Being', 'Entity', 'Presence', 'Study', 'Mark'],
  jewelry: ['Relic', 'Crown', 'Band', 'Orb', 'Sigil', 'Jewel', 'Halo', 'Mark'],
  abstract: ['Drift', 'Form', 'Study', 'Composition', 'Field', 'Object', 'Wave', 'Echo'],
  sword: ['Blade', 'Edge', 'Sword', 'Fang', 'Shard', 'Mark', 'Rune', 'Zero'],
  fortress: ['Keep', 'Bastion', 'Wall', 'Citadel', 'Hold', 'Watch', 'Mark', 'Prime'],
  mushroom: ['Grove', 'Cap', 'Cluster', 'Spore', 'Bloom', 'Ring', 'Form', 'Study'],
  satellite: ['Relay', 'Node', 'Array', 'Probe', 'Link', 'Beacon', 'Mark', 'Zero'],
  totem: ['Totem', 'Mark', 'Pillar', 'Sign', 'Pole', 'Idol', 'Form', 'Study'],
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

function usdPriceFor(ethPrice) {
  // Approximate display USD (not live rate — for UI only)
  const n = Number(ethPrice) || 0.08;
  return (n * 3200).toFixed(0);
}

function blocksFor(rarity, seed) {
  const base = {
    Common: 900, Uncommon: 1300, Rare: 1800,
    Epic: 2600, Legendary: 3800, Mythic: 5200,
  }[rarity] || 1600;
  const jitter = hash(String(seed) + ':b') % 400;
  return (base + jitter).toLocaleString();
}

export function getCatalogItem(index) {
  const id = index + 1;
  const seed = `vv-catalog-${id}`;
  const shape = availableShapes[hash(seed + ':shape') % availableShapes.length];
  const material = availableMaterials[hash(seed + ':mat') % availableMaterials.length];
  const rarity = weightedRarity(seed);
  const style = pick(STYLES, seed + ':style');
  const prefixes = NAME_PREFIX[shape] || ['Voxel'];
  const suffixes = NAME_SUFFIX[shape] || ['Form'];
  const name = `${pick(prefixes, seed + ':n1')} ${pick(suffixes, seed + ':n2')}`;
  const creator = pick(CREATORS, seed + ':c');
  const type = TYPES[shape] || 'World';
  const color = pick(COLORS, seed + ':col');
  const eth = priceFor(rarity, seed);

  return {
    id,
    name,
    creator,
    shape,
    material,
    style,
    type,
    rarity,
    price: eth,
    priceUsd: usdPriceFor(eth),
    blocks: blocksFor(rarity, seed),
    color,
    seed,
    description: `${style} ${rarity.toLowerCase()} ${material} ${type.toLowerCase()} · unique deterministic form from the Voxel Vault catalog.`,
  };
}

export function getCatalogWindow(start = 0, count = 12) {
  const items = [];
  for (let i = start; i < start + count; i++) {
    items.push(getCatalogItem(i));
  }
  return items;
}

/** Logical size of the endless vault — items are generated on demand, never all at once. */
export const CATALOG_SIZE = 100000;
