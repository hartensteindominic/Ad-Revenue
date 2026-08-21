import assert from 'node:assert/strict';
import { allocateCampaignCents, buildCampaign, quoteSponsoredClaim } from '../lib/sponsor/campaignLedger.js';
import { NFT_WORLD_CATALOG, getNFTById } from '../lib/world/nftWorldCatalog.js';
import { buildNFTGenerationBrief, chooseNextMissions } from '../lib/ai/worldDirector.js';
import { optimizeVaultPlacement } from '../lib/quantum/worldOptimizer.js';

const campaign = buildCampaign({ id: 'demo-buffalo', name: 'Buffalo Discovery', budgetCents: 100_000, maxClaims: 500 });
const allocation = allocateCampaignCents(10_000, campaign.splitBps);
assert.equal(allocation.collector + allocation.vaultOwner + allocation.protocol, 10_000);
assert.equal(quoteSponsoredClaim({ campaign, claimCents: 150 }).disclosed, true);
assert.ok(NFT_WORLD_CATALOG.length >= 30);
assert.ok(NFT_WORLD_CATALOG.some((item) => item.sponsored));
assert.ok(getNFTById(100));
assert.equal(buildNFTGenerationBrief({ seed: 'x', family: 'creature', rarity: 'Rare' }).uniqueness.deterministic, true);
assert.equal(chooseNextMissions([{ name: 'a', distanceM: 5, freshness: 1, rarity: 'Rare' }]).length, 1);
const ranked = optimizeVaultPlacement([{ id: 'a', rewardPotential: 1, discoveryPotential: .8, distanceCost: .1, safetyScore: 1 }, { id: 'b', rewardPotential: .2, discoveryPotential: .2, distanceCost: .9, safetyScore: .2 }]);
assert.equal(ranked[0].id, 'a');
console.log('NFT WORLD + SPONSORED REVENUE + AI + QUANTUM TESTS: PASS');
