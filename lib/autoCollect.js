const DEFAULT_RADIUS_METERS = 8;
const DEFAULT_COOLDOWN_MS = 30_000;

export function distanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const R = 6371000;
  const p1 = Number(a.lat) * Math.PI / 180;
  const p2 = Number(b.lat) * Math.PI / 180;
  const dp = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
  const dl = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
  const x = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function canAutoCollect({ userLocation, dropLocation, radiusMeters = DEFAULT_RADIUS_METERS, lastAttemptAt = 0, now = Date.now(), walletConnected = false, explicitClaim = false } = {}) {
  const distance = distanceMeters(userLocation, dropLocation);
  const inRange = distance <= Math.max(1, Number(radiusMeters) || DEFAULT_RADIUS_METERS);
  const cooldownPassed = now - Number(lastAttemptAt || 0) >= DEFAULT_COOLDOWN_MS;
  return {
    eligible: Boolean(inRange && cooldownPassed && walletConnected && explicitClaim),
    inRange,
    distanceMeters: Number.isFinite(distance) ? Math.round(distance * 10) / 10 : null,
    needsWallet: !walletConnected,
    needsConfirmation: !explicitClaim,
    cooldownPassed,
  };
}
