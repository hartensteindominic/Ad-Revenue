import { generateVisualDNA } from '@/lib/universalCollectible';
import { getRealisticRules } from '@/lib/generation/realisticRules';

const hash32 = (value) => {
  let h = 2166136261;
  for (const char of String(value)) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const pick = (seed, values, offset = 0) => values[hash32(`${seed}:${offset}`) % values.length];
const number = (seed, min, max, offset = 0) => min + (hash32(`${seed}:n:${offset}`) % 10000) / 10000 * (max - min);

export function createAssetPlan({ seed = 'voxel', family = 'other', rarity = 'common', subtype = null, creativeDirection = '' } = {}) {
  const visualDNA = generateVisualDNA(seed, rarity, family);
  const rules = getRealisticRules(family);
  const resolvedSubtype = subtype && rules.subtypes.includes(subtype) ? subtype : pick(seed, rules.subtypes, 1);
  const material = pick(seed, rules.materials, 2);
  const traitSlots = rules.traits.map((trait, index) => ({
    trait,
    value: pick(`${seed}:${trait}`, ['A', 'B', 'C', 'D'], index),
  }));

  return {
    version: 1,
    seed,
    family,
    rarity,
    subtype: resolvedSubtype,
    material,
    visualDNA,
    realism: {
      ruleSet: family,
      plausibility: 'high',
      detailDensity: Number(number(seed, 0.45, 0.92, 11).toFixed(3)),
      surfaceVariation: Number(number(seed, 0.18, 0.72, 12).toFixed(3)),
    },
    traits: traitSlots,
    geometry: {
      silhouetteStrength: Number(number(seed, 0.35, 0.95, 20).toFixed(3)),
      asymmetry: Number(number(seed, 0.02, 0.32, 21).toFixed(3)),
      secondaryForms: Math.min(8, Math.max(0, visualDNA.mutationBudget - 1)),
      microDetailPasses: Math.min(6, 1 + Math.floor(visualDNA.detail * 5)),
    },
    presentation: {
      environment: visualDNA.environment,
      rotation: visualDNA.rotation,
      scale: visualDNA.scale,
      glow: rarity === 'mythic' ? 'legendary' : rarity,
    },
    creativeDirection: String(creativeDirection).slice(0, 4000),
  };
}

export function buildProviderPayload(plan) {
  return {
    task: 'create_unique_3d_collectible',
    format: 'glb',
    seed: plan.seed,
    family: plan.family,
    subtype: plan.subtype,
    rarity: plan.rarity,
    material: plan.material,
    visualDNA: plan.visualDNA,
    realism: plan.realism,
    geometry: plan.geometry,
    presentation: plan.presentation,
    creativeDirection: plan.creativeDirection,
  };
}
