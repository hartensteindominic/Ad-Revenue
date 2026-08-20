/**
 * Bootstrap and operating pool accounting.
 * This is an internal ledger model, not a payment processor and not proof of funds.
 * Production settlement must be backed by the real payment/treasury system.
 */

function cents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid pool amount');
  return Math.round(n * 100);
}

function dollars(value) {
  return value / 100;
}

export function createFundingPool({ bootstrap = 0 } = {}) {
  const initial = cents(bootstrap);
  return {
    version: 1,
    bootstrapFunded: dollars(initial),
    sponsorRevenue: 0,
    marketplaceRevenue: 0,
    rewardsCommitted: 0,
    infrastructureCommitted: 0,
    creatorPayoutsCommitted: 0,
    reserve: dollars(initial),
  };
}

export function recordFunding(pool, { source, amount } = {}) {
  if (!pool) throw new Error('Pool is required');
  const value = cents(amount);
  if (!['bootstrap', 'sponsor', 'marketplace'].includes(source)) throw new Error('Unknown funding source');
  const next = { ...pool };
  if (source === 'bootstrap') next.bootstrapFunded += dollars(value);
  if (source === 'sponsor') next.sponsorRevenue += dollars(value);
  if (source === 'marketplace') next.marketplaceRevenue += dollars(value);
  next.reserve += dollars(value);
  return next;
}

export function commitPoolSpend(pool, { category, amount } = {}) {
  if (!pool) throw new Error('Pool is required');
  const value = cents(amount);
  const key = { rewards: 'rewardsCommitted', infrastructure: 'infrastructureCommitted', creator: 'creatorPayoutsCommitted' }[category];
  if (!key) throw new Error('Unknown pool spend category');
  if (pool.reserve < dollars(value)) throw new Error('Insufficient pool reserve');
  const next = { ...pool, reserve: Math.round((pool.reserve - dollars(value)) * 100) / 100 };
  next[key] = Math.round((next[key] + dollars(value)) * 100) / 100;
  return next;
}

/**
 * Uses explicit monthly revenue inputs. Cumulative ledger totals are not
 * incorrectly treated as recurring revenue.
 */
export function sustainabilitySnapshot(pool, { monthlySponsorRevenue = 0, monthlyMarketplaceRevenue = 0, monthlyOperatingCost = 0 } = {}) {
  if (!pool) throw new Error('Pool is required');
  const sponsor = cents(monthlySponsorRevenue);
  const marketplace = cents(monthlyMarketplaceRevenue);
  const cost = cents(monthlyOperatingCost);
  const monthlyNet = sponsor + marketplace - cost;
  return {
    recurringRevenue: dollars(sponsor + marketplace),
    monthlyOperatingCost: dollars(cost),
    monthlyNet: dollars(monthlyNet),
    selfSustaining: monthlyNet >= 0,
    bootstrapReserve: pool.bootstrapFunded,
    currentReserve: pool.reserve,
  };
}
