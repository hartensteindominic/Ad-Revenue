/**
 * Voxel Atlas contextual intelligence.
 * Pure client-safe ranking helpers. No location is uploaded here.
 */

const KIND_WEIGHT = {
  vault: 1.2,
  hunt: 1.15,
  collectible: 1.1,
  landmark: 1,
  saved: 0.95,
};

export function distanceMeters(a, b) {
  if (!a || !b) return Infinity;
  const lat1 = Number(a.lat);
  const lon1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lon2 = Number(b.lng);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return Infinity;

  const R = 6371000;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function rankNearbyPlaces(origin, places = [], options = {}) {
  const maxDistance = Number.isFinite(options.maxDistance) ? options.maxDistance : 25000;
  const now = Date.now();

  return places
    .filter(Boolean)
    .map((place) => {
      const distance = distanceMeters(origin, place);
      const weight = KIND_WEIGHT[place.kind] || 0.8;
      const freshness = place.updatedAt ? Math.max(0, 1 - (now - new Date(place.updatedAt).getTime()) / 604800000) : 0.4;
      const featured = place.featured ? 0.25 : 0;
      const proximity = Math.max(0, 1 - distance / maxDistance);
      return { ...place, distance, score: proximity * weight + freshness * 0.2 + featured };
    })
    .filter((place) => place.distance <= maxDistance)
    .sort((a, b) => b.score - a.score);
}

export function buildAtlasPromptContext(origin, places = []) {
  const ranked = rankNearbyPlaces(origin, places).slice(0, 12);
  return ranked.map((p) => ({
    id: p.id,
    name: p.name,
    kind: p.kind,
    distanceMeters: Math.round(p.distance),
    description: p.description || '',
  }));
}

export function getAtlasSuggestions(origin, places = []) {
  const ranked = rankNearbyPlaces(origin, places);
  const suggestions = [];
  const seen = new Set();

  for (const item of ranked) {
    if (seen.has(item.id)) continue;
    if (item.kind === 'hunt') suggestions.push({ icon: '🎯', label: `Hunt nearby: ${item.name}`, place: item });
    else if (item.kind === 'vault') suggestions.push({ icon: '📍', label: `Your Vault Spot: ${item.name}`, place: item });
    else if (item.kind === 'collectible') suggestions.push({ icon: '🧊', label: `Collectible nearby: ${item.name}`, place: item });
    else suggestions.push({ icon: '✨', label: `Explore: ${item.name}`, place: item });
    seen.add(item.id);
    if (suggestions.length === 4) break;
  }

  return suggestions;
}
