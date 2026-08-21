const ID_VERSION = 1;
const STORAGE_PREFIX = 'voxel-vault:identity:v1:';

const TITLES = [
  { level: 1, name: 'New Vault', description: 'Your journey begins.' },
  { level: 5, name: 'Scout', description: 'You are starting to map the world.' },
  { level: 10, name: 'Explorer', description: 'Discovery is becoming a habit.' },
  { level: 20, name: 'Roadrunner', description: 'Movement is part of your Vault.' },
  { level: 35, name: 'Curator', description: 'Your collection has a point of view.' },
  { level: 50, name: 'World Scout', description: 'The Vault recognizes a veteran explorer.' },
  { level: 75, name: 'Vault Architect', description: 'You shape the world around your identity.' },
  { level: 100, name: 'Vault Founder', description: 'A legendary identity tier.' },
];

const ACTION_XP = Object.freeze({
  discovery: 25,
  mission: 60,
  expedition: 40,
  collectible: 80,
  rareCollectible: 140,
  mythicCollectible: 300,
  verifiedMile: 8,
  streakDay: 20,
});

function clampInteger(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export function createVaultIdentity(address = '') {
  const normalized = String(address || '').toLowerCase();
  return {
    version: ID_VERSION,
    id: createVaultId(normalized),
    address: normalized,
    xp: 0,
    energy: 0,
    discoveries: 0,
    missions: 0,
    expeditions: 0,
    distanceMiles: 0,
    rare: 0,
    mythic: 0,
    streak: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createVaultId(address = '') {
  const input = String(address || 'anonymous').toLowerCase();
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `VAULT-${(hash >>> 0).toString(16).toUpperCase().padStart(8, '0').slice(0, 6)}`;
}

export function getVaultLevel(xp = 0) {
  return Math.max(1, Math.floor(Math.sqrt(clampInteger(xp) / 20)) + 1);
}

export function getVaultTitle(level = 1) {
  const current = [...TITLES].reverse().find((title) => level >= title.level);
  return current || TITLES[0];
}

export function getVaultIdentityKey(address = '') {
  return `${STORAGE_PREFIX}${String(address || 'anonymous').toLowerCase()}`;
}

export function loadVaultIdentity(address = '') {
  if (typeof window === 'undefined') return createVaultIdentity(address);
  try {
    const raw = window.localStorage.getItem(getVaultIdentityKey(address));
    if (!raw) return createVaultIdentity(address);
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== ID_VERSION) return createVaultIdentity(address);
    return normalizeVaultIdentity({ ...createVaultIdentity(address), ...parsed, address: String(address || '').toLowerCase() });
  } catch {
    return createVaultIdentity(address);
  }
}

export function saveVaultIdentity(identity) {
  if (typeof window === 'undefined' || !identity?.address) return identity;
  const normalized = normalizeVaultIdentity(identity);
  try {
    window.localStorage.setItem(getVaultIdentityKey(normalized.address), JSON.stringify(normalized));
  } catch {
    // Local persistence is an enhancement, never a gameplay dependency.
  }
  return normalized;
}

export function normalizeVaultIdentity(identity) {
  const base = createVaultIdentity(identity?.address || '');
  return {
    ...base,
    ...identity,
    xp: clampInteger(identity?.xp),
    energy: clampInteger(identity?.energy),
    discoveries: clampInteger(identity?.discoveries),
    missions: clampInteger(identity?.missions),
    expeditions: clampInteger(identity?.expeditions),
    distanceMiles: Math.max(0, Number(identity?.distanceMiles) || 0),
    rare: clampInteger(identity?.rare),
    mythic: clampInteger(identity?.mythic),
    streak: clampInteger(identity?.streak),
    id: createVaultId(identity?.address || ''),
    updatedAt: new Date().toISOString(),
  };
}

export function applyVaultAction(identity, action, amount = 1) {
  const current = normalizeVaultIdentity(identity);
  const count = Math.max(1, clampInteger(amount));
  const next = { ...current };
  const xp = ACTION_XP[action] || 0;

  if (action === 'discovery') next.discoveries += count;
  if (action === 'mission') next.missions += count;
  if (action === 'expedition') next.expeditions += count;
  if (action === 'verifiedMile') next.distanceMiles += count;
  if (action === 'streakDay') next.streak += count;
  if (action === 'rareCollectible') next.rare += count;
  if (action === 'mythicCollectible') next.mythic += count;

  if (action === 'collectible') next.energy += 15 * count;
  if (action === 'rareCollectible') next.energy += 30 * count;
  if (action === 'mythicCollectible') next.energy += 75 * count;
  if (action === 'discovery') next.energy += 5 * count;
  if (action === 'mission') next.energy += 20 * count;
  if (action === 'expedition') next.energy += 10 * count;
  if (action === 'verifiedMile') next.energy += Math.min(100, count * 2);

  next.xp += xp * count;
  return normalizeVaultIdentity(next);
}

export function getVaultSummary(identity) {
  const current = normalizeVaultIdentity(identity);
  const level = getVaultLevel(current.xp);
  const title = getVaultTitle(level);
  return {
    ...current,
    level,
    title: title.name,
    titleDescription: title.description,
    displayDistance: `${current.distanceMiles.toFixed(1)} mi`,
  };
}

export { ACTION_XP, TITLES };
