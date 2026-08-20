import assert from 'node:assert/strict';
import { createFundingPool, recordFunding, commitPoolSpend, sustainabilitySnapshot } from '../lib/fundingPool.mjs';

let pool = createFundingPool({ bootstrap: 500 });
assert.equal(pool.reserve, 500);
pool = recordFunding(pool, { source: 'sponsor', amount: 250 });
assert.equal(pool.sponsorRevenue, 250);
assert.equal(pool.reserve, 750);
pool = commitPoolSpend(pool, { category: 'infrastructure', amount: 100 });
assert.equal(pool.infrastructureCommitted, 100);
assert.equal(pool.reserve, 650);
assert.throws(() => commitPoolSpend(pool, { category: 'rewards', amount: 1000 }), /Insufficient/);

const snapshot = sustainabilitySnapshot(pool, {
  monthlySponsorRevenue: 300,
  monthlyMarketplaceRevenue: 100,
  monthlyOperatingCost: 350,
});
assert.equal(snapshot.recurringRevenue, 400);
assert.equal(snapshot.monthlyNet, 50);
assert.equal(snapshot.selfSustaining, true);

console.log('funding pool tests: PASS');
