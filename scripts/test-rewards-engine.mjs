import assert from 'node:assert/strict';
import { cents, splitCents, rewardEvent } from '../lib/rewards/ledger.js';
import { reconcileReward, transitionReward } from '../lib/rewards/reconcile.js';
import { canCreditReward } from '../lib/rewards/verifiedEvent.js';

assert.equal(cents(12.34), 1234);
assert.deepEqual(splitCents(100, { collector: 70, creator: 20, platform: 10 }), { collector: 70, creator: 20, platform: 10 });
const event = rewardEvent({ id: 'r1', campaignId: 'c1', paymentId: 'p1', collector: '0xabc', amountCents: 700 });
assert.equal(canCreditReward({ ...event, status: 'pending' }).ok, false);
assert.equal(canCreditReward({ ...event, status: 'verified' }).ok, true);
assert.equal(reconcileReward(event, { paymentVerified: true, campaignActive: true, amountCents: 700, currency: 'usd' }).record.status, 'claimable');
assert.throws(() => transitionReward({ ...event, status: 'pending' }, 'paid'));
console.log('Rewards engine regression tests passed');
