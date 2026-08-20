import assert from 'node:assert/strict';
import { createFundingPool, recordFunding, commitPoolSpend, sustainabilitySnapshot } from '../lib/fundingPool.mjs';

let pool = createFundingPool({ bootstrap: 500 });
assert.equal(pool.reserve, 500);
pool = recordFunding(pool, { source: 'sponsor', amount: 250 });
assert.equal(pool.reserve, 750);
pool = commitPoolSpend(pool, { category: 'rewards', amount: 100 });
assert.equal(pool.reserve, 650);
assert.equal(pool.rewardsCommitted, 100);

const healthy = sustainabilitySnapshot(pool, { monthlySponsorRevenue: 1000, monthlyMarketplaceRevenue: 250, monthlyOperatingCost: 900 });
assert.equal(healthy.selfSustaining, true);
assert.equal(healthy.monthlyNet, 350);

const dependent = sustainabilitySnapshot(pool, { monthlySponsorRevenue: 100, monthlyMarketplaceRevenue: 25, monthlyOperatingCost: 900 });
assert.equal(dependent.selfSustaining, false);
assert.equal(dependent.monthlyNet, -775);

assert.throws(() => commitPoolSpend(pool, { category: 'rewards', amount: 1000 }));
assert.throws(() => recordFunding(pool, { source: 'unknown', amount: 1 }));

console.log('Funding pool tests passed.');
