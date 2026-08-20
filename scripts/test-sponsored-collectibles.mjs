import assert from 'node:assert/strict';
import {
  createSponsoredCampaign,
  calculateCollectorReward,
  buildSponsoredCollectible,
} from '../lib/sponsoredCollectibles.mjs';

const campaign = createSponsoredCampaign({
  id: 'test-campaign',
  sponsorName: 'Test Sponsor',
  title: 'Test Object Drop',
  budget: 1000,
});

assert.equal(campaign.budget, 1000);
assert.equal(campaign.allocation.creator + campaign.allocation.collectorRewards + campaign.allocation.platform + campaign.allocation.reserve, 1000);
assert.equal(campaign.policy.sponsorshipDisclosed, true);
assert.equal(campaign.policy.ownershipRequiresWalletAuthorization, true);

const reward = calculateCollectorReward({ campaign, completedClaims: 0, maxClaims: 100 });
assert.equal(reward.reward, 3.5);

const collectible = buildSponsoredCollectible({ campaign, collectible: { id: 'object-1', name: 'Object 1' } });
assert.equal(collectible.sponsorship.campaignId, 'test-campaign');
assert.equal(collectible.sponsorship.disclosed, true);

assert.throws(() => createSponsoredCampaign({ sponsorName: 'Bad', title: 'Bad', budget: 10, creatorShare: 0.9, collectorRewardShare: 0.9, platformShare: 0, reserveShare: 0 }), /ratios/);
assert.throws(() => buildSponsoredCollectible({ campaign, collectible: {} }), /Collectible/);

console.log('sponsored collectible tests: PASS');
