/**
 * Sponsor-funded collectible economics. Sponsorship is disclosed and never
 * bypasses wallet authorization or blockchain settlement.
 */
const MAX_CAMPAIGN_BUDGET = 1_000_000_000;
const MAX_REWARD = 1_000_000;

function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid monetary amount');
  return Math.round(n * 100) / 100;
}

function ratio(value, fallback) {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('Ratio must be between 0 and 1');
  return n;
}

export function createSponsoredCampaign(input = {}) {
  const budget = money(input.budget);
  if (budget <= 0 || budget > MAX_CAMPAIGN_BUDGET) throw new Error('Campaign budget is outside the supported range');
  const sponsorName = String(input.sponsorName || '').trim();
  const title = String(input.title || '').trim();
  if (!sponsorName || sponsorName.length > 120) throw new Error('A valid sponsor name is required');
  if (!title || title.length > 160) throw new Error('A valid campaign title is required');

  const creatorShare = ratio(input.creatorShare, 0.25);
  const collectorRewardShare = ratio(input.collectorRewardShare, 0.35);
  const platformShare = ratio(input.platformShare, 0.20);
  const reserveShare = ratio(input.reserveShare, 0.20);
  if (Math.abs(creatorShare + collectorRewardShare + platformShare + reserveShare - 1) > 0.000001) {
    throw new Error('Campaign allocation ratios must total 1');
  }

  return {
    id: input.id || `sponsor-${Date.now().toString(36)}`,
    sponsorName,
    title,
    disclosure: 'Sponsored collectible',
    budget,
    allocation: {
      creator: money(budget * creatorShare),
      collectorRewards: money(budget * collectorRewardShare),
      platform: money(budget * platformShare),
      reserve: money(budget * reserveShare),
    },
    policy: {
      organicContent: true,
      sponsorshipDisclosed: true,
      ownershipRequiresWalletAuthorization: true,
      discoveryDoesNotGrantOwnership: true,
    },
    createdAt: new Date().toISOString(),
  };
}

export function calculateCollectorReward({ campaign, completedClaims = 0, maxClaims = 1 } = {}) {
  if (!campaign?.allocation) throw new Error('Campaign allocation is required');
  const completed = Math.max(0, Math.floor(Number(completedClaims) || 0));
  const capacity = Math.max(1, Math.floor(Number(maxClaims) || 1));
  const pool = money(campaign.allocation.collectorRewards);
  const reward = Math.min(MAX_REWARD, money(pool / capacity));
  return { reward, remainingPool: money(Math.max(0, pool - reward * completed)), capacity, completedClaims: completed };
}

export function canFundDrop(campaign, requestedReward = 0) {
  const amount = money(requestedReward);
  return Boolean(campaign?.allocation?.collectorRewards >= amount && amount <= MAX_REWARD);
}

export function buildSponsoredCollectible({ campaign, collectible } = {}) {
  if (!campaign?.id) throw new Error('Campaign is required');
  if (!collectible?.id) throw new Error('Collectible is required');
  return {
    ...collectible,
    sponsorship: {
      campaignId: campaign.id,
      sponsorName: campaign.sponsorName,
      label: 'Sponsored collectible',
      disclosed: true,
    },
  };
}
