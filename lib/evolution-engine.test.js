import assert from 'node:assert/strict';
import { getEvolutionTier, predictEvolution } from './evolution-engine.js';

const base = { holdDays: 30, trades: 5, wisdom: 0, crossChainMiles: 0, sales: 0 };
assert.equal(getEvolutionTier(base).tier, 2);
assert.equal(getEvolutionTier({ ...base, wisdom: 100 }).tier, 3);
assert.equal(getEvolutionTier({ ...base, wisdom: 100, crossChainMiles: 1 }).tier, 4);
assert.equal(getEvolutionTier({ ...base, holdDays: 365, wisdom: 100, crossChainMiles: 1, sales: 10 }).tier, 6);
assert.equal(getEvolutionTier({ ...base, holdDays: 365, wisdom: 1000, crossChainMiles: 100, sales: 10 }).tier, 7);

const prediction = predictEvolution({ ...base, wisdom: 100 });
assert.equal(prediction.current.tier, 3);
assert.equal(prediction.next.tier, 4);
assert.equal(prediction.remaining.crossChainMiles, 1);

console.log('evolution-engine: PASS');
