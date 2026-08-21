const STORAGE_KEY = 'voxel-vault-atlas-v1';
const MAX_STORED_PLACES = 500;

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeMapPlace(input = {}) {
  const lat = safeNumber(input.lat);
  const lng = safeNumber(input.lng);
  if (lat === null || lng === null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new Error('Invalid map coordinates');
  }

  return {
    id: String(input.id || `${lat.toFixed(5)}:${lng.toFixed(5)}`),
    lat,
    lng,
    name: String(input.name || 'Unnamed place').slice(0, 120),
    type: String(input.type || 'spot').slice(0, 40),
    note: String(input.note || '').slice(0, 500),
    tags: Array.isArray(input.tags) ? input.tags.map(String).slice(0, 12) : [],
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: input.source === 'device' ? 'device' : 'user',
    vaultSpotId: input.vaultSpotId ? String(input.vaultSpotId) : null,
  };
}

export function loadMapMemory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_STORED_PLACES) : [];
  } catch {
    return [];
  }
}

export function saveMapPlace(place) {
  if (typeof window === 'undefined') return place;
  const normalized = normalizeMapPlace(place);
  const current = loadMapMemory().filter((item) => item.id !== normalized.id);
  const next = [normalized, ...current].slice(0, MAX_STORED_PLACES);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return normalized;
}

export function removeMapPlace(id) {
  if (typeof window === 'undefined') return;
  const next = loadMapMemory().filter((item) => item.id !== String(id));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearMapMemory() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export const MAP_MEMORY_STORAGE_KEY = STORAGE_KEY;
