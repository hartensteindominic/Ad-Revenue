import assert from 'node:assert/strict';
import {
  createSponsoredCampaign,
  calculateCollectorReward,
  canFundDrop,
  buildSponsoredCollectible,
} from '../lib/sponsoredCollectibles.mjs';

const campaign = createSponsoredCampaign({
  sponsorName: 'Example Brand',
  title: 'Field Relic Series',
  budget: 1000,
});

assert.equal(campaign.disclosure, 'Sponsored collectible');
assert.equal(campaign.policy.sponsorshipDisclosed, true);
assert.equal(campaign.policy.discoveryDoesNotGrantOwnership, true);
assert.equal(
  campaign.allocation.creator + campaign.allocation.collectorRewards + campaign.allocation.platform + campaign.allocation.reserve,
  1000,
);

const reward = calculateCollectorReward({ campaign, completedClaims: 0, maxClaims: 100 });
assert.equal(reward.reward, 3.5);
assert.equal(canFundDrop(campaign, reward.reward), true);

const collectible = buildSponsoredCollectible({ campaign, collectible: { id: 'demo-1', name: 'Field Relic' } });
assert.equal(collectible.sponsorship.disclosed, true);
assert.equal(collectible.sponsorship.campaignId, campaign.id);

assert.throws(() => createSponsoredCampaign({ sponsorName: 'x', title: 'y', budget: 0 }));
assert.throws(() => createSponsoredCampaign({ sponsorName: 'x', title: 'y', budget: 100, creatorShare: 0.9, collectorRewardShare: 0.9, platformShare: 0.1, reserveShare: 0.1 }));

console.log('Sponsored collectible tests passed.');
