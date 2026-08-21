export const CLAIM_POLICY = Object.freeze({
  proximityMeters: 12,
  confirmationRequired: true,
  neverSignSilently: true,
  cooldownMs: 15000,
  requireWalletConnected: true,
});

export function distanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371000;
  const lat1 = Number(a.lat) * Math.PI / 180;
  const lat2 = Number(b.lat) * Math.PI / 180;
  const dLat = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
  const dLng = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function createClaimIntent({ dropId, wallet, userLocation, dropLocation, now = Date.now() } = {}) {
  if (!dropId || !wallet) return { eligible: false, reason: 'missing_claim_context' };
  const distance = distanceMeters(userLocation, dropLocation);
  return {
    eligible: distance <= CLAIM_POLICY.proximityMeters,
    requiresConfirmation: CLAIM_POLICY.confirmationRequired,
    neverSignSilently: CLAIM_POLICY.neverSignSilently,
    distanceMeters: Number(distance.toFixed(2)),
    createdAt: now,
    expiresAt: now + CLAIM_POLICY.cooldownMs,
  };
}
