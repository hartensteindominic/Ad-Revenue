const TIERS = Object.freeze([
  { tier: 1, name: 'Awakened', holdDays: 30, trades: 0, wisdom: 0, crossChainMiles: 0, sales: 0 },
  { tier: 2, name: 'Patina', holdDays: 30, trades: 5, wisdom: 0, crossChainMiles: 0, sales: 0 },
  { tier: 3, name: 'Oracle', holdDays: 30, trades: 5, wisdom: 100, crossChainMiles: 0, sales: 0 },
  { tier: 4, name: 'Traveler', holdDays: 30, trades: 5, wisdom: 100, crossChainMiles: 1, sales: 0 },
  { tier: 5, name: 'Ancient', holdDays: 365, trades: 5, wisdom: 100, crossChainMiles: 1, sales: 0 },
  { tier: 6, name: 'Legend', holdDays: 365, trades: 5, wisdom: 100, crossChainMiles: 1, sales: 10 },
  { tier: 7, name: 'Mythic', holdDays: 365, trades: 5, wisdom: 1000, crossChainMiles: 100, sales: 10 },
  { tier: 8, name: 'Ascended', holdDays: 730, trades: 20, wisdom: 2500, crossChainMiles: 500, sales: 25 },
]);

function n(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeEvolutionStats(stats = {}) {
  return {
    holdDays: n(stats.holdDays),
    trades: n(stats.trades),
    wisdom: n(stats.wisdom),
    crossChainMiles: n(stats.crossChainMiles),
    sales: n(stats.sales),
  };
}

export function meetsEvolutionTier(stats, requirement) {
  const s = normalizeEvolutionStats(stats);
  return Object.entries(requirement).every(([key, value]) => key === 'tier' || key === 'name' || s[key] >= value);
}

export function getEvolutionTier(stats = {}) {
  const normalized = normalizeEvolutionStats(stats);
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (meetsEvolutionTier(normalized, tier)) current = tier;
  }
  return { ...current, stats: normalized };
}

export function predictEvolution(stats = {}) {
  const normalized = normalizeEvolutionStats(stats);
  const current = getEvolutionTier(normalized);
  const next = TIERS.find(tier => tier.tier === current.tier + 1);
  if (!next) return { current, next: null, unlocked: true, remaining: {} };
  const remaining = {};
  for (const key of ['holdDays', 'trades', 'wisdom', 'crossChainMiles', 'sales']) {
    remaining[key] = Math.max(0, next[key] - normalized[key]);
  }
  return { current, next, unlocked: false, remaining };
}

export function getEvolutionTiers() {
  return TIERS.map(tier => ({ ...tier }));
}
