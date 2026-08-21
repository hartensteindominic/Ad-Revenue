export const COLLECTION_EXPERIENCE = Object.freeze({
  primaryLoop: Object.freeze(['walk', 'discover', 'collect', 'earn']),
  cameraRequired: false,
  arPeekEnabled: true,
  locationRequiredForProximityDrops: true,
  microInteractionOptional: true,
  defaultInteractionMs: 800,
  phonePosition: 'natural',
  privacy: Object.freeze({
    rawGpsPublic: false,
    rawGpsOnChain: false,
    coarseSpatialDiscovery: true,
    cameraIndependentOfLocation: true,
  }),
  states: Object.freeze([
    'discovered',
    'eligible',
    'reserved',
    'authorized',
    'submitted',
    'confirmed',
    'owned',
    'rewarded',
  ]),
});

export function canCollectWithoutCamera() {
  return COLLECTION_EXPERIENCE.cameraRequired === false;
}

export function getCollectionPresentation({ distanceMeters, rarity = 'common', sponsored = false } = {}) {
  const distance = Number.isFinite(Number(distanceMeters)) ? Math.max(0, Number(distanceMeters)) : null;
  return {
    mode: 'walk',
    cameraRequired: false,
    showArPeek: COLLECTION_EXPERIENCE.arPeekEnabled,
    distanceMeters: distance,
    rarity,
    sponsored,
    primaryAction: distance !== null && distance <= 12 ? 'COLLECT' : 'APPROACH',
  };
}
