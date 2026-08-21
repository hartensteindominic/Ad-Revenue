const RARITY_BUDGET = { common: 1, uncommon: 2, rare: 3, epic: 5, legendary: 7, mythic: 9 };
const hash = (value) => { let h = 2166136261; for (const c of String(value)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const pick = (seed, list, offset = 0) => list[(hash(`${seed}:${offset}`) % list.length)];
const num = (seed, min, max, offset = 0) => min + (hash(`${seed}:n:${offset}`) % 10000) / 10000 * (max - min);

export function createVisualDNA({ seed = 'voxel', family = 'other', rarity = 'common', traits = [] } = {}) {
  const key = `${seed}:${family}:${rarity}`;
  const budget = RARITY_BUDGET[rarity] ?? 1;
  const palettes = ['graphite-silver', 'ice-blue', 'obsidian-violet', 'warm-gold', 'arctic-white', 'deep-emerald', 'copper-black'];
  const finishes = ['brushed', 'polished', 'satin', 'ceramic', 'glass-metal', 'stone', 'forged'];
  const silhouettes = ['compact', 'balanced', 'tall', 'wide', 'angular', 'organic'];
  const accents = ['none', 'micro-light', 'edge-light', 'inset-light', 'spectral'];
  const mutationTypes = ['proportion', 'surface', 'accent', 'accessory', 'detail', 'environment', 'motion'];
  return {
    version: 1,
    seed,
    family,
    rarity,
    palette: pick(key, palettes, 1),
    finish: pick(key, finishes, 2),
    silhouette: pick(key, silhouettes, 3),
    accent: pick(key, accents, 4),
    scale: Number(num(key, 0.88, 1.14, 5).toFixed(3)),
    rotation: Number(num(key, -0.12, 0.12, 6).toFixed(3)),
    detailDensity: Number(num(key, 0.25, 0.95, 7).toFixed(3)),
    mutationBudget: budget,
    mutations: Array.from({ length: budget }, (_, i) => ({
      type: pick(key, mutationTypes, 20 + i),
      strength: Number(num(key, 0.12, 0.9, 40 + i).toFixed(3)),
      slot: i,
    })),
    sourceTraits: Array.isArray(traits) ? traits : [],
  };
}

export function visualDNAKey(dna) { return JSON.stringify(dna); }
