/**
 * Voxel Vault sponsored-collectible economics.
 *
 * Trust rule: this module calculates policy/economics only. It never grants
 * ownership, confirms a transaction, or treats client analytics as proof.
 * All money math is integer cents via BigInt.
 */

const MAX_CAMPAIGN_BUDGET_CENTS = 100_000_000_000n;
const MAX_REWARD_CENTS = 100_000_000n;
const BPS = 10_000n;
const DEFAULT_SPLITS_BPS = Object.freeze({
  creator: 2_500n,
  collectorRewards: 3_500n,
  platform: 2_000n,
  reserve: 2_000n,
});

function parseCents(value) {
  const raw = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) throw new TypeError('Money must be a non-negative decimal with at most 2 decimals');
  const [whole, fraction = ''] = raw.split('.');
  const result = BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
  if (result > MAX_CAMPAIGN_BUDGET_CENTS) throw new RangeError('Amount exceeds campaign budget limit');
  return result;
}

function formatCents(value) {
  const cents = BigInt(value);
  if (cents < 0n) throw new RangeError('Negative money is not allowed');
  return `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`;
}

function parseBps(value, fallback) {
  const raw = value ?? fallback;
  if (!Number.isInteger(raw) || raw < 0 || raw > 10_000) throw new TypeError('Share must be integer basis points 0-10000');
  return BigInt(raw);
}

function allocate(totalCents, splits = DEFAULT_SPLITS_BPS) {
  const entries = Object.entries(splits).map(([key, value]) => [key, BigInt(value)]);
  const sum = entries.reduce((acc, [, value]) => acc + value, 0n);
  if (sum !== BPS) throw new Error('Allocation must total 10000 basis points');

  let remaining = BigInt(totalCents);
  const result = {};
  entries.forEach(([key, share], index) => {
    const amount = index === entries.length - 1 ? remaining : (totalCents * share) / BPS;
    result[key] = amount;
    remaining -= amount;
  });
  if (remaining !== 0n) throw new Error('Allocation accounting mismatch');
  return Object.freeze(result);
}

export function createSponsoredCampaign(input = {}) {
  const budgetCents = parseCents(input.budget);
  if (budgetCents <= 0n) throw new Error('Campaign budget must be positive');

  const sponsorName = String(input.sponsorName || '').trim();
  const title = String(input.title || '').trim();
  if (!sponsorName || sponsorName.length > 120) throw new Error('A valid sponsor name is required');
  if (!title || title.length > 160) throw new Error('A valid campaign title is required');

  const splits = {
    creator: parseBps(input.creatorShareBps, Number(DEFAULT_SPLITS_BPS.creator)),
    collectorRewards: parseBps(input.collectorRewardShareBps, Number(DEFAULT_SPLITS_BPS.collectorRewards)),
    platform: parseBps(input.platformShareBps, Number(DEFAULT_SPLITS_BPS.platform)),
    reserve: parseBps(input.reserveShareBps, Number(DEFAULT_SPLITS_BPS.reserve)),
  };

  const allocation = allocate(budgetCents, splits);

  return Object.freeze({
    id: String(input.id || `sponsor-${Date.now().toString(36)}`),
    sponsorName,
    title,
    disclosure: 'Sponsored collectible',
    budgetCents: budgetCents.toString(),
    budget: formatCents(budgetCents),
    allocationCents: Object.freeze(Object.fromEntries(Object.entries(allocation).map(([k, v]) => [k, v.toString()]))),
    allocation: Object.freeze(Object.fromEntries(Object.entries(allocation).map(([k, v]) => [k, formatCents(v)]))),
    policy: Object.freeze({
      sponsorshipDisclosed: true,
      ownershipRequiresWalletAuthorization: true,
      discoveryDoesNotGrantOwnership: true,
      clientAnalyticsAreNotSettlementProof: true,
    }),
    createdAt: new Date().toISOString(),
  });
}

export function calculateCollectorReward({ campaign, completedClaims = 0, maxClaims = 1 } = {}) {
  if (!campaign?.allocationCents?.collectorRewards) throw new Error('Campaign allocation is required');
  if (!Number.isSafeInteger(completedClaims) || completedClaims < 0) throw new TypeError('completedClaims must be a non-negative safe integer');
  if (!Number.isSafeInteger(maxClaims) || maxClaims < 1) throw new TypeError('maxClaims must be a positive safe integer');

  const pool = BigInt(campaign.allocationCents.collectorRewards);
  const reward = pool / BigInt(maxClaims);
  if (reward > MAX_REWARD_CENTS) throw new RangeError('Per-collector reward exceeds configured cap');
  const consumed = reward * BigInt(completedClaims);

  return Object.freeze({
    rewardCents: reward.toString(),
    reward: formatCents(reward),
    remainingPoolCents: (consumed >= pool ? 0n : pool - consumed).toString(),
    remainingPool: formatCents(consumed >= pool ? 0n : pool - consumed),
    capacity: maxClaims,
    completedClaims,
  });
}

export function canFundDrop(campaign, requestedReward) {
  if (!campaign?.allocationCents?.collectorRewards) return false;
  const amount = parseCents(requestedReward);
  const pool = BigInt(campaign.allocationCents.collectorRewards);
  return amount <= MAX_REWARD_CENTS && amount <= pool;
}

export function validateSponsoredDisclosure(value) {
  const disclosure = String(value ?? '').trim();
  return disclosure.length >= 1 && disclosure.length <= 2_000;
}

export function buildSponsoredCollectible({ campaign, collectible, disclosure } = {}) {
  if (!campaign?.id) throw new Error('Campaign is required');
  if (!collectible?.id) throw new Error('Collectible is required');
  if (!validateSponsoredDisclosure(disclosure || campaign.disclosure)) {
    throw new Error('Sponsored collectibles require a disclosure of 1-2000 characters');
  }

  return Object.freeze({
    ...collectible,
    sponsorship: Object.freeze({
      campaignId: campaign.id,
      sponsorName: campaign.sponsorName,
      label: 'Sponsored collectible',
      disclosed: true,
      disclosure: String(disclosure || campaign.disclosure).trim(),
    }),
  });
}

export { formatCents };
