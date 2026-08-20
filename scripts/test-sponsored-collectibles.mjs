import assert from 'node:assert/strict';
import {
  createSponsoredCampaign,
  calculateCollectorReward,
  canFundDrop,
  buildSponsoredCollectible,
  validateSponsoredDisclosure,
} from '../lib/sponsoredCollectibles.mjs';

const campaign = createSponsoredCampaign({
  sponsorName: 'Example Brand',
  title: 'Field Relic Series',
  budget: '1000.00',
});

assert.equal(campaign.disclosure, 'Sponsored collectible');
assert.equal(campaign.policy.sponsorshipDisclosed, true);
assert.equal(campaign.policy.discoveryDoesNotGrantOwnership, true);
assert.equal(campaign.policy.clientAnalyticsAreNotSettlementProof, true);
assert.equal(
  BigInt(campaign.budgetCents),
  Object.values(campaign.allocationCents).reduce((sum, value) => sum + BigInt(value), 0n),
);
assert.equal(campaign.allocation.collectorRewards, '350.00');

const reward = calculateCollectorReward({ campaign, completedClaims: 0, maxClaims: 100 });
assert.equal(reward.reward, '3.50');
assert.equal(canFundDrop(campaign, '3.50'), true);
assert.equal(canFundDrop(campaign, '350.01'), false);

const collectible = buildSponsoredCollectible({
  campaign,
  collectible: { id: 'demo-1', name: 'Field Relic' },
});
assert.equal(collectible.sponsorship.disclosed, true);
assert.equal(collectible.sponsorship.campaignId, campaign.id);
assert.equal(validateSponsoredDisclosure(collectible.sponsorship.disclosure), true);

assert.throws(() => createSponsoredCampaign({ sponsorName: 'x', title: 'y', budget: '0.00' }));
assert.throws(() => createSponsoredCampaign({ sponsorName: 'x', title: 'y', budget: '100.00', creatorShareBps: 9000, collectorRewardShareBps: 9000, platformShareBps: 1000, reserveShareBps: 1000 }));
assert.throws(() => createSponsoredCampaign({ sponsorName: 'x', title: 'y', budget: '1.001' }));
assert.throws(() => calculateCollectorReward({ campaign, completedClaims: -1, maxClaims: 1 }));

console.log('Sponsored collectible hardened tests passed.');
