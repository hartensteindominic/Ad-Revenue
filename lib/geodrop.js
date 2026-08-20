export function createGeoDrop({ collectibleId, latitude, longitude, radiusMeters = 25, expiresAt = null }) {
  if (!collectibleId) throw new Error('collectibleId is required');
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Valid coordinates are required');
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('Coordinates are out of range');
  }
  return {
    version: 1,
    collectibleId,
    location: { latitude, longitude },
    radiusMeters: Math.max(5, radiusMeters),
    expiresAt,
    status: 'active'
  };
}

export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function isInsideDrop(drop, position) {
  return distanceMeters(drop.location, position) <= drop.radiusMeters;
}
