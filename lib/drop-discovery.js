export function validateDropZone({ latitude, longitude, radiusMeters = 50 }) {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error('Invalid latitude');
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error('Invalid longitude');
  if (!Number.isFinite(radiusMeters) || radiusMeters < 5 || radiusMeters > 5000) throw new Error('Invalid drop radius');
  return { latitude, longitude, radiusMeters };
}

export function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (value) => value * Math.PI / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function isDiscoverable(drop, userLocation, now = Date.now()) {
  if (!drop || !userLocation) return false;
  if (drop.startsAt && now < new Date(drop.startsAt).getTime()) return false;
  if (drop.endsAt && now > new Date(drop.endsAt).getTime()) return false;
  if (!drop.zone) return false;
  return distanceMeters(drop.zone, userLocation) <= drop.zone.radiusMeters;
}
