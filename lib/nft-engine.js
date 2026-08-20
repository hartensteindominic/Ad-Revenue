const MATERIAL_PALETTES = {
  chrome: ['#c8d0e0', '#f0f4ff', '#8a94a8', '#2a303c', '#e8f0ff'],
  glass: ['#a8e0ff', '#e0f8ff', '#6ab0d0', '#1a3040', '#f0fbff'],
  crystal: ['#d0a0ff', '#f0e0ff', '#9060d0', '#2a1840', '#f8f0ff'],
  stone: ['#a8a090', '#d8d0c0', '#686058', '#302820', '#f0ece0'],
  wood: ['#8b5a2b', '#c48a50', '#5a3818', '#2a1808', '#e8d0a0'],
  ceramic: ['#e8e0d0', '#f8f4e8', '#b0a890', '#504830', '#fff8f0'],
  neon: ['#00f0ff', '#ff00c8', '#80ff40', '#101820', '#ffffff'],
  holographic: ['#ff80c0', '#80e0ff', '#c080ff', '#181028', '#f0e0ff'],
  metallic: ['#b0b8c8', '#e0e8f0', '#606878', '#1a2028', '#f0f4ff'],
  organic: ['#60a050', '#a0d080', '#306020', '#182010', '#e0f0c0'],
  weathered: ['#908070', '#c0b0a0', '#504030', '#201810', '#e8d8c0'],
  lava: ['#ff6020', '#ffc040', '#a03010', '#201008', '#ffe0a0'],
  ice: ['#b0e0ff', '#e8f8ff', '#6090c0', '#102030', '#f0fbff'],
  gold: ['#e0b040', '#ffe080', '#a07020', '#302010', '#fff8d0'],
  default: ['#7659ff', '#b6a4ff', '#38d5ff', '#17182a', '#f3f7ff']
};

const SHAPE_DEFAULT_MATERIAL = {
  car: 'metallic', villa: 'stone', owl: 'organic', fox: 'organic', robot: 'chrome',
  statue: 'stone', ship: 'metallic', tree: 'organic', dragon: 'crystal', mech: 'chrome',
  crystal: 'crystal', portal: 'holographic', temple: 'stone', motorcycle: 'chrome',
  alien: 'organic', jewelry: 'gold', abstract: 'holographic', sword: 'metallic',
  fortress: 'stone', mushroom: 'organic', satellite: 'chrome', totem: 'wood'
};

const RARITY = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, Mythic: 6 };

const add = (out, x, y, z, c = 0) => out.push([x, y, z, c]);
const box = (out, x1, x2, y1, y2, z1, z2, c = 0) => {
  for (let x = x1; x <= x2; x++) for (let y = y1; y <= y2; y++) for (let z = z1; z <= z2; z++) add(out, x, y, z, c);
};

function hashString(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let s = hashString(String(seed)) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function baseShape(shape) {
  const v = [];

  if (shape === 'car') {
    box(v, -8, 8, 0, 2, -3, 3, 0);
    box(v, -7, 7, 3, 3, -3, 3, 2);
    box(v, -5, 5, 4, 5, -2, 2, 0);
    box(v, -3, 3, 5, 5, -1, 1, 1);
    box(v, -7, 7, 1, 1, -4, -4, 3);
    box(v, -7, 7, 1, 1, 4, 4, 3);
    for (const x of [-6, 6]) for (const z of [-3, 3]) box(v, x, x, -2, 0, z, z, 3);
    for (const x of [-5, -4, 4, 5]) for (const z of [-3, 3]) add(v, x, 0, z, 4);
    for (const x of [-3, -2, 2, 3]) for (let z = -2; z <= 2; z++) add(v, x, 4, z, 1);
    box(v, -1, 1, 2, 2, -4, -4, 4);
  } else if (shape === 'villa') {
    box(v, -7, 7, 0, 4, -5, 5, 0);
    box(v, -7, 7, 5, 5, -5, 5, 1);
    box(v, -5, 5, 6, 6, -4, 4, 0);
    box(v, -3, 3, 7, 7, -3, 3, 0);
    for (const x of [-6, 6]) for (const z of [-4, 4]) box(v, x, x, 1, 3, z, z, 2);
    box(v, -2, 2, 1, 3, -6, -6, 2);
    box(v, -1, 1, 1, 2, 6, 6, 2);
    for (const x of [-5, -4, 4, 5]) for (const z of [-5, 5]) box(v, x, x, 1, 3, z, z, 3);
    box(v, -7, -7, 4, 5, -1, 1, 3);
    box(v, 7, 7, 4, 5, -1, 1, 3);
  } else if (shape === 'owl' || shape === 'fox') {
    const fox = shape === 'fox';
    for (let y = 0; y <= 6; y++) {
      const r = (fox ? 10 : 11) - Math.max(0, y - 2) * 2;
      for (let x = -3; x <= 3; x++) for (let z = -3; z <= 3; z++) if (x * x + z * z <= r) add(v, x, y, z, y >= 5 ? 1 : 0);
    }
    for (const x of [-3, 3]) box(v, x, x, 5, 8, -1, 1, 1);
    for (const x of [-2, 2]) box(v, x, x, -1, 0, -1, 1, 0);
    add(v, -1, 6, -4, 2);
    add(v, 1, 6, -4, 2);
    add(v, 0, 6, -4, 3);
    if (fox) {
      for (let y = 1; y <= 4; y++) add(v, 4, y, 0, 0);
      for (let y = 0; y <= 2; y++) add(v, 5, y, 0, 1);
      box(v, 3, 4, 1, 2, 0, 0, 1);
    }
  } else if (shape === 'robot') {
    box(v, -3, 3, 0, 5, -3, 3, 0);
    box(v, -2, 2, 6, 9, -2, 2, 1);
    box(v, -4, -4, 1, 5, -1, 1, 2);
    box(v, 4, 4, 1, 5, -1, 1, 2);
    box(v, -2, -2, -3, -1, -1, 1, 2);
    box(v, 2, 2, -3, -1, -1, 1, 2);
    add(v, -1, 8, -3, 3);
    add(v, 1, 8, -3, 3);
    add(v, 0, 10, 0, 4);
    for (const x of [-3, 3]) for (const y of [2, 4]) add(v, x, y, -2, 3);
  } else if (shape === 'statue') {
    box(v, -4, 4, 0, 1, -4, 4, 2);
    box(v, -3, 3, 2, 3, -3, 3, 0);
    box(v, -2, 2, 4, 8, -2, 2, 0);
    box(v, -3, 3, 9, 10, -2, 2, 1);
    box(v, -3, -3, 4, 7, -1, 1, 2);
    box(v, 3, 3, 4, 7, -1, 1, 2);
    box(v, -1, 1, 11, 12, -1, 1, 1);
  } else if (shape === 'ship') {
    for (let y = 0; y <= 3; y++) for (let x = -8 + y; x <= 8 - y; x++) for (let z = -3; z <= 3; z++) add(v, x, y, z, y === 3 ? 1 : 0);
    box(v, -5, 5, 4, 6, -2, 2, 0);
    box(v, -2, 2, 7, 10, -1, 1, 3);
    box(v, -1, 1, 11, 12, -1, 1, 4);
    box(v, -5, 5, 7, 7, 0, 0, 4);
    for (const x of [-6, 6]) box(v, x, x, 1, 2, -3, 3, 2);
  } else if (shape === 'tree') {
    box(v, -1, 1, 0, 6, -1, 1, 2);
    for (let y = 5; y <= 11; y++) for (let x = -4; x <= 4; x++) for (let z = -4; z <= 4; z++) if (x * x + z * z <= 17 - (y - 5) * 2) add(v, x, y, z, y > 8 ? 1 : 0);
    box(v, -2, 2, 8, 9, -2, 2, 1);
  } else if (shape === 'dragon') {
    box(v, -2, 2, 2, 5, -6, 4, 0);
    box(v, -1, 1, 5, 8, 3, 7, 0);
    box(v, -2, 2, 8, 10, 6, 9, 1);
    add(v, -1, 9, 10, 3); add(v, 1, 9, 10, 3); add(v, 0, 8, 10, 4);
    for (let x = 3; x <= 8; x++) for (let z = -2; z <= 2; z++) if (Math.abs(z) <= (9 - x) / 2) add(v, x, 6, z, 2);
    for (let x = -8; x <= -3; x++) for (let z = -2; z <= 2; z++) if (Math.abs(z) <= (9 + x) / 2) add(v, x, 6, z, 2);
    box(v, -3, -2, 0, 2, -3, -1, 0); box(v, 2, 3, 0, 2, -3, -1, 0);
    box(v, -3, -2, 0, 2, 2, 4, 0); box(v, 2, 3, 0, 2, 2, 4, 0);
    for (let z = -10; z <= -6; z++) add(v, 0, 3 + Math.floor((z + 10) * 0.4), z, 1);
  } else if (shape === 'mech') {
    box(v, -4, 4, 3, 8, -3, 3, 0);
    box(v, -3, 3, 9, 12, -2, 2, 1);
    box(v, -6, -5, 4, 9, -1, 1, 2); box(v, 5, 6, 4, 9, -1, 1, 2);
    box(v, -3, -1, 0, 3, -2, 2, 0); box(v, 1, 3, 0, 3, -2, 2, 0);
    box(v, -5, -4, 10, 11, -1, 1, 3); box(v, 4, 5, 10, 11, -1, 1, 3);
    add(v, -1, 11, -3, 4); add(v, 1, 11, -3, 4); add(v, 0, 13, 0, 4);
  } else if (shape === 'crystal') {
    for (let y = 0; y <= 12; y++) {
      const r = Math.max(1, 5 - Math.floor(y / 2.2));
      for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) {
        if (Math.abs(x) + Math.abs(z) <= r + 1) add(v, x, y, z, y > 9 ? 1 : (y > 5 ? 0 : 2));
      }
    }
    for (const s of [-1, 1]) {
      box(v, s * 6, s * 6, 2, 7, -1, 1, 3);
      box(v, -1, 1, 2, 7, s * 6, s * 6, 3);
    }
  } else if (shape === 'portal') {
    for (let a = 0; a < 24; a++) {
      const ang = (a / 24) * Math.PI * 2;
      const x = Math.round(Math.cos(ang) * 7);
      const z = Math.round(Math.sin(ang) * 7);
      for (let y = 0; y <= 10; y++) add(v, x, y, z, y > 7 ? 1 : 0);
    }
    for (let y = 2; y <= 8; y++) for (let x = -4; x <= 4; x++) for (let z = -1; z <= 1; z++) {
      if (x * x + z * z < 18) add(v, x, y, z, 4);
    }
  } else if (shape === 'temple') {
    box(v, -8, 8, 0, 2, -8, 8, 0);
    box(v, -6, 6, 3, 4, -6, 6, 1);
    box(v, -4, 4, 5, 6, -4, 4, 0);
    box(v, -2, 2, 7, 9, -2, 2, 1);
    for (const x of [-7, -3, 3, 7]) for (const z of [-7, -3, 3, 7]) box(v, x, x, 0, 5, z, z, 2);
    box(v, -1, 1, 10, 11, -1, 1, 3);
  } else if (shape === 'motorcycle') {
    box(v, -5, 5, 1, 3, -2, 2, 0);
    box(v, -3, 3, 4, 5, -1, 1, 1);
    box(v, -6, -5, 0, 4, -1, 1, 2); box(v, 5, 6, 0, 4, -1, 1, 2);
    for (const x of [-5, 5]) for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      add(v, x + Math.round(Math.cos(ang) * 2), 1 + Math.round(Math.sin(ang) * 2), 0, 3);
    }
    box(v, -1, 1, 5, 7, -1, 0, 4);
  } else if (shape === 'alien') {
    box(v, -2, 2, 0, 4, -2, 2, 0);
    box(v, -3, 3, 5, 8, -2, 2, 1);
    box(v, -4, -4, 6, 9, -1, 1, 2); box(v, 4, 4, 6, 9, -1, 1, 2);
    add(v, -2, 9, -3, 3); add(v, 2, 9, -3, 3);
    box(v, -1, 1, 9, 10, -1, 1, 4);
    for (const s of [-1, 1]) box(v, s * 3, s * 3, 0, 2, -1, 1, 0);
  } else if (shape === 'jewelry') {
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      add(v, Math.round(Math.cos(ang) * 5), 4, Math.round(Math.sin(ang) * 5), 0);
      add(v, Math.round(Math.cos(ang) * 4), 5, Math.round(Math.sin(ang) * 4), 1);
    }
    box(v, -1, 1, 0, 3, -1, 1, 2);
    box(v, -2, 2, 6, 8, -2, 2, 3);
    add(v, 0, 9, 0, 4);
  } else if (shape === 'abstract') {
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      const x = Math.round(Math.sin(t * Math.PI * 4) * 6);
      const y = Math.round(t * 12);
      const z = Math.round(Math.cos(t * Math.PI * 3) * 5);
      add(v, x, y, z, i % 5);
      add(v, -x, y, -z, (i + 2) % 5);
    }
    box(v, -1, 1, 0, 1, -1, 1, 0);
  } else if (shape === 'sword') {
    box(v, -1, 1, 2, 12, 0, 0, 0);
    box(v, -3, 3, 2, 3, -1, 1, 1);
    box(v, -1, 1, 0, 1, -1, 1, 2);
    box(v, -2, 2, 12, 13, -1, 1, 3);
    add(v, 0, 14, 0, 4);
  } else if (shape === 'fortress') {
    box(v, -8, 8, 0, 5, -8, 8, 0);
    box(v, -6, 6, 6, 7, -6, 6, 1);
    for (const x of [-8, 8]) for (const z of [-8, 8]) box(v, x - 1, x + 1, 0, 9, z - 1, z + 1, 2);
    box(v, -2, 2, 8, 10, -2, 2, 0);
    box(v, -1, 1, 11, 12, -1, 1, 3);
  } else if (shape === 'mushroom') {
    box(v, -1, 1, 0, 5, -1, 1, 2);
    for (let y = 5; y <= 8; y++) {
      const r = 6 - (y - 5);
      for (let x = -r; x <= r; x++) for (let z = -r; z <= r; z++) if (x * x + z * z <= r * r) add(v, x, y, z, y === 5 ? 0 : 1);
    }
  } else if (shape === 'satellite') {
    box(v, -2, 2, 3, 7, -2, 2, 0);
    box(v, -6, -3, 4, 6, -1, 1, 1); box(v, 3, 6, 4, 6, -1, 1, 1);
    box(v, -1, 1, 8, 10, -1, 1, 2);
    for (const s of [-1, 1]) box(v, s * 7, s * 7, 3, 7, -3, 3, 3);
    add(v, 0, 11, 0, 4);
  } else if (shape === 'totem') {
    box(v, -2, 2, 0, 12, -2, 2, 0);
    box(v, -3, 3, 3, 4, -3, 3, 1);
    box(v, -3, 3, 7, 8, -3, 3, 1);
    box(v, -4, 4, 11, 12, -2, 2, 2);
    add(v, -2, 10, -3, 3); add(v, 2, 10, -3, 3);
    add(v, 0, 13, 0, 4);
  } else {
    box(v, -3, 3, 0, 6, -3, 3, 0);
    box(v, -2, 2, 7, 9, -2, 2, 1);
    add(v, 0, 10, 0, 4);
  }

  return v;
}

export function generateVoxelAsset({ shape = 'car', seed = 'voxel-vault-1', rarity = 'Rare', material } = {}) {
  const level = RARITY[rarity] || 3;
  const random = rng(`${shape}:${seed}:${rarity}:${material || ''}`);
  const voxels = baseShape(shape);
  const used = new Set(voxels.map(v => `${v[0]},${v[1]},${v[2]}`));

  const addUnique = (x, y, z, c) => {
    const k = `${x},${y},${z}`;
    if (!used.has(k)) {
      used.add(k);
      add(voxels, x, y, z, c);
    }
  };

  const matKey = material || SHAPE_DEFAULT_MATERIAL[shape] || 'default';
  const palette = MATERIAL_PALETTES[matKey] || MATERIAL_PALETTES.default;

  // Much denser detail so models feel fuller
  const detailCount = level * 14 + Math.floor(random() * level * 12);
  for (let i = 0; i < detailCount; i++) {
    const x = Math.floor(random() * 19) - 9;
    const y = Math.floor(random() * 16) - 2;
    const z = Math.floor(random() * 15) - 7;
    addUnique(x, y, z, Math.floor(random() * Math.min(5, 2 + level)));
  }

  // Surface plating / panel lines
  if (level >= 2) {
    for (let i = 0; i < level * 4; i++) {
      const x = Math.floor(random() * 13) - 6;
      const y = Math.floor(random() * 10);
      const z = Math.floor(random() * 11) - 5;
      addUnique(x, y, z, 2);
      addUnique(x + 1, y, z, 2);
    }
  }

  // Epic+ structural accents
  if (level >= 4) {
    for (let x = -7; x <= 7; x++) addUnique(x, 8, Math.round(Math.sin(x * 0.7) * 2.5), 4);
    for (const s of [-1, 1]) {
      addUnique(8 * s, 9, 0, 3);
      addUnique(9 * s, 10, 0, 4);
      addUnique(7 * s, 7, 2, 3);
      addUnique(7 * s, 7, -2, 3);
    }
  }

  // Legendary+ denser crown / aura
  if (level >= 5) {
    for (let x = -8; x <= 8; x++) for (let z = -3; z <= 3; z++) if ((x * x + z * z) % 3 === 0) addUnique(x, 11, z, 4);
    for (const s of [-1, 1]) for (let y = 0; y < 8; y++) addUnique(10 * s, y, 0, 3);
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      addUnique(Math.round(Math.cos(ang) * 6), 12, Math.round(Math.sin(ang) * 6), 4);
    }
  }

  // Mythic orbital / energy rings + dense halo
  if (level >= 6) {
    for (let y = 0; y < 7; y++) {
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const x = Math.round(Math.cos(ang) * (9 + y * 0.35));
        const z = Math.round(Math.sin(ang) * (9 + y * 0.35));
        addUnique(x, y + 1, z, 4);
      }
    }
    for (let i = 0; i < 30; i++) {
      addUnique(Math.floor(random() * 17) - 8, Math.floor(random() * 14), Math.floor(random() * 13) - 6, 4);
    }
  }

  const dna = `VV3-${shape}-${matKey}-${rarity}-${hashString(`${seed}:${shape}:${rarity}:${matKey}:${voxels.length}`).toString(16).padStart(8, '0')}`;

  return {
    version: 3,
    shape,
    material: matKey,
    rarity,
    seed,
    dna,
    palette,
    voxelCount: voxels.length,
    voxels
  };
}

export async function sha256DNA(asset) {
  const data = new TextEncoder().encode(JSON.stringify({
    shape: asset.shape,
    material: asset.material,
    rarity: asset.rarity,
    seed: asset.seed,
    dna: asset.dna,
    voxels: asset.voxels
  }));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export const voxelPalettes = MATERIAL_PALETTES;
export const availableShapes = Object.keys(SHAPE_DEFAULT_MATERIAL);
export const availableMaterials = Object.keys(MATERIAL_PALETTES);
