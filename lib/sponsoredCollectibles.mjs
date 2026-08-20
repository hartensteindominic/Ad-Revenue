/**
 * Sponsor-funded collectible economics.
 * Money is handled as integer cents internally to avoid floating-point drift.
 * Sponsorship is disclosed and never bypasses wallet authorization or settlement.
 */
const MAX_CAMPAIGN_BUDGET_CENTS = 100_000_000_000;
const MAX_REWARD_CENTS = 100_000_000;

function cents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid monetary amount');
  return Math.round(n * 100);
}

function dollars(valueCents) {
  return valueCents / 100;
}

function ratio(value, fallback) {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error('Ratio must be between 0 and 1');
  return n;
}

export function createSponsoredCampaign(input = {}) {
  const budgetCents = cents(input.budget);
  if (budgetCents <= 0 || budgetCents > MAX_CAMPAIGN_BUDGET_CENTS) throw new Error('Campaign budget is outside the supported range');

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

  const creatorCents = Math.round(budgetCents * creatorShare);
  const collectorRewardsCents = Math.round(budgetCents * collectorRewardShare);
  const platformCents = Math.round(budgetCents * platformShare);
  const reserveCents = budgetCents - creatorCents - collectorRewardsCents - platformCents;

  return {
    id: input.id || `sponsor-${Date.now().toString(36)}`,
    sponsorName,
    title,
    disclosure: 'Sponsored collectible',
    budget: dollars(budgetCents),
    allocation: {
      creator: dollars(creatorCents),
      collectorRewards: dollars(collectorRewardsCents),
      platform: dollars(platformCents),
      reserve: dollars(reserveCents),
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
  const poolCents = cents(campaign.allocation.collectorRewards);
  const rewardCents = Math.min(MAX_REWARD_CENTS, Math.floor(poolCents / capacity));
  return {
    reward: dollars(rewardCents),
    remainingPool: dollars(Math.max(0, poolCents - rewardCents * completed)),
    capacity,
    completedClaims: completed,
  };
}

export function canFundDrop(campaign, requestedReward = 0) {
  const amountCents = cents(requestedReward);
  return Boolean(campaign?.allocation?.collectorRewards >= dollars(amountCents) && amountCents <= MAX_REWARD_CENTS);
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
