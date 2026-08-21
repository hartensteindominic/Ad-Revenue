import assert from 'node:assert/strict';
import { IDLE_RULES, accrueEnergy, clampIdleMinutes, createExpedition, getReactorState, spendEnergy } from '../lib/idleExpedition.js';

assert.equal(clampIdleMinutes(-5), 0);
assert.equal(clampIdleMinutes(999), IDLE_RULES.maxSessionMinutes);
assert.deepEqual(accrueEnergy({ minutes: 15, currentEnergy: 2, earnedToday: 0 }), { minutes: 15, earned: 15, energy: 17, capped: false });
assert.equal(accrueEnergy({ minutes: 999, currentEnergy: 0, earnedToday: 235 }).earned, 5);
assert.equal(accrueEnergy({ minutes: 15, currentEnergy: 0, earnedToday: 240 }).earned, 0);
assert.equal(getReactorState(1000, { active: true, startedAt: 1000 }).elapsedMinutes, 0);
assert.equal(getReactorState(601000, { active: true, startedAt: 1000 }).elapsedMinutes, 10);
assert.equal(spendEnergy(25, 10), 15);
assert.throws(() => spendEnergy(5, 6), /Not enough Vault Energy/);
assert.deepEqual(createExpedition({ id: 'x', minutes: 20, energyCost: 8 }).rewardType, 'verified-progress');
console.log('Idle Expedition tests passed');
