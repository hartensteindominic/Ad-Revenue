import { OBJECT_FAMILIES, RARITIES } from '../universalCollectible';

/**
 * Category grammars keep randomness believable. This is deliberately data-first:
 * new object types can be added without changing ownership, trading or drop logic.
 */
export const REALISTIC_RULES = {
  vehicles: {
    subtypes: ['car', 'motorcycle', 'aircraft', 'boat', 'spacecraft'],
    materials: ['aluminum', 'steel', 'carbon_fiber', 'painted_composite', 'glass'],
    traits: ['body_style', 'propulsion', 'wheel_or_engine_layout', 'finish', 'era'],
  },
  technology: {
    subtypes: ['camera', 'computer', 'console', 'robot', 'drone', 'instrument'],
    materials: ['aluminum', 'polycarbonate', 'glass', 'rubber', 'brushed_steel'],
    traits: ['form_factor', 'control_layout', 'sensor_package', 'finish', 'era'],
  },
  fashion: {
    subtypes: ['sneaker', 'watch', 'bag', 'accessory'],
    materials: ['leather', 'canvas', 'mesh', 'rubber', 'steel', 'ceramic'],
    traits: ['silhouette', 'material', 'closure', 'colorway', 'era'],
  },
  sports: {
    subtypes: ['skateboard', 'helmet', 'ball', 'racket', 'board'],
    materials: ['wood', 'composite', 'rubber', 'aluminum', 'carbon_fiber'],
    traits: ['shape', 'equipment_type', 'finish', 'graphics', 'era'],
  },
  architecture: {
    subtypes: ['building', 'bridge', 'tower', 'room', 'structure'],
    materials: ['concrete', 'steel', 'glass', 'brick', 'stone', 'wood'],
    traits: ['structural_style', 'facade', 'roof', 'era', 'environment'],
  },
  nature: {
    subtypes: ['tree', 'plant', 'rock', 'crystal', 'landform'],
    materials: ['wood', 'stone', 'mineral', 'organic'],
    traits: ['species_or_form', 'age', 'surface', 'environment', 'scale'],
  },
  creatures: {
    subtypes: ['mammal', 'bird', 'reptile', 'insect', 'marine', 'fantastical'],
    materials: ['fur', 'feather', 'scale', 'skin', 'shell', 'fantasy_surface'],
    traits: ['anatomy', 'markings', 'pose', 'habitat', 'variant'],
  },
  artifacts: {
    subtypes: ['tool', 'sculpture', 'relic', 'instrument', 'artifact'],
    materials: ['bronze', 'stone', 'wood', 'ceramic', 'iron', 'glass'],
    traits: ['form', 'craft', 'age', 'surface', 'provenance_style'],
  },
  science: {
    subtypes: ['laboratory', 'microscope', 'specimen', 'device', 'model'],
    materials: ['glass', 'steel', 'ceramic', 'plastic', 'silicon'],
    traits: ['instrument_type', 'scale', 'era', 'finish', 'function'],
  },
  scifi: {
    subtypes: ['drone', 'probe', 'vehicle', 'station', 'device'],
    materials: ['titanium', 'carbon_fiber', 'ceramic', 'alloy', 'glass'],
    traits: ['propulsion', 'sensor_array', 'structure', 'energy_system', 'finish'],
  },
  fantasy: {
    subtypes: ['creature', 'relic', 'artifact', 'structure', 'vehicle'],
    materials: ['stone', 'metal', 'wood', 'crystal', 'enchanted_material'],
    traits: ['form', 'origin', 'surface', 'ornament', 'rarity_feature'],
  },
  furniture: {
    subtypes: ['chair', 'table', 'lamp', 'cabinet', 'fixture'],
    materials: ['wood', 'steel', 'glass', 'fabric', 'stone'],
    traits: ['form', 'joinery', 'finish', 'era', 'style'],
  },
  other: {
    subtypes: ['object'],
    materials: ['metal', 'wood', 'glass', 'stone', 'composite'],
    traits: ['form', 'material', 'finish', 'era', 'detail'],
  },
};

export function getRealisticRules(family) {
  return REALISTIC_RULES[family] || REALISTIC_RULES.other;
}

export function validateGenerationRequest({ family, rarity = 'common', quantity = 1 } = {}) {
  const errors = [];
  if (!OBJECT_FAMILIES.includes(family)) errors.push(`Unsupported object family: ${family}`);
  if (!RARITIES.includes(rarity)) errors.push(`Unsupported rarity: ${rarity}`);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) {
    errors.push('Quantity must be an integer between 1 and 10,000');
  }
  return { valid: errors.length === 0, errors };
}
