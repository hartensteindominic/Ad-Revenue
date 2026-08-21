const EARTH_RADIUS_M = 6371008.8;
const MAX_PUBLIC_RADIUS_M = 5000;

function finite(value) {
  return Number.isFinite(Number(value));
}

export function normalizeAnchor(input = {}) {
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (!finite(lat) || !finite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Invalid spatial anchor coordinates');
  }
  const altitude = finite(input.altitude) ? Number(input.altitude) : null;
  const radiusM = Math.min(Math.max(Number(input.radiusM) || 25, 1), MAX_PUBLIC_RADIUS_M);
  return {
    id: String(input.id || `anchor-${lat.toFixed(5)}-${lng.toFixed(5)}`),
    lat,
    lng,
    altitude,
    radiusM,
    indoor: Boolean(input.indoor),
    roomId: input.roomId ? String(input.roomId) : null,
    localPosition: input.localPosition && ['x', 'y', 'z'].every(key => finite(input.localPosition[key]))
      ? { x: Number(input.localPosition.x), y: Number(input.localPosition.y), z: Number(input.localPosition.z) }
      : null,
    privacy: input.privacy === 'private' ? 'private' : 'public',
  };
}

export function distanceMeters(a, b) {
  const lat1 = Number(a.lat) * Math.PI / 180;
  const lat2 = Number(b.lat) * Math.PI / 180;
  const dLat = (Number(b.lat) - Number(a.lat)) * Math.PI / 180;
  const dLng = (Number(b.lng) - Number(a.lng)) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function altitudeEligible(anchor, userAltitude, toleranceM = 20) {
  if (anchor.altitude === null || !finite(userAltitude)) return true;
  return Math.abs(Number(userAltitude) - anchor.altitude) <= Math.max(1, Number(toleranceM) || 20);
}

export function isInRange(anchorInput, position, options = {}) {
  const anchor = normalizeAnchor(anchorInput);
  if (!position || !finite(position.lat) || !finite(position.lng)) return false;
  const distance = distanceMeters(anchor, position);
  const altitudeOk = altitudeEligible(anchor, position.altitude, options.altitudeToleranceM);
  return distance <= anchor.radiusM && altitudeOk;
}

export function buildClaimIntent(anchorInput, position, context = {}) {
  const anchor = normalizeAnchor(anchorInput);
  const inRange = isInRange(anchor, position, context);
  return {
    type: 'spatial-claim-intent',
    anchorId: anchor.id,
    eligible: inRange,
    distanceM: position ? Math.round(distanceMeters(anchor, position) * 10) / 10 : null,
    wallet: context.wallet || null,
    issuedAt: Date.now(),
    requiresExplicitWalletConfirmation: true,
    privacy: anchor.privacy,
  };
}
