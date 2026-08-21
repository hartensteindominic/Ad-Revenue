const MAX_BPS = 10_000;

export const DEFAULT_CAMPAIGN_SPLIT_BPS = Object.freeze({
  collector: 7000,
  vaultOwner: 1000,
  protocol: 2000,
});

export function validateSplitBps(split = DEFAULT_CAMPAIGN_SPLIT_BPS) {
  const keys = ['collector', 'vaultOwner', 'protocol'];
  const normalized = Object.fromEntries(keys.map((key) => [key, Number(split[key])]));
  if (keys.some((key) => !Number.isInteger(normalized[key]) || normalized[key] < 0)) {
    throw new Error('Campaign split must contain non-negative integer basis points');
  }
  if (keys.reduce((sum, key) => sum + normalized[key], 0) !== MAX_BPS) {
    throw new Error('Campaign split must total exactly 10000 basis points');
  }
  return Object.freeze(normalized);
}

export function allocateCampaignCents(amountCents, split = DEFAULT_CAMPAIGN_SPLIT_BPS) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) throw new Error('amountCents must be a positive safe integer');
  const bps = validateSplitBps(split);
  const collector = Math.floor((amountCents * bps.collector) / MAX_BPS);
  const vaultOwner = Math.floor((amountCents * bps.vaultOwner) / MAX_BPS);
  const protocol = amountCents - collector - vaultOwner;
  return Object.freeze({ amountCents, collector, vaultOwner, protocol, splitBps: bps });
}

export function buildCampaign({ id, name, budgetCents, currency = 'usd', split, sponsoredDisclosure = true, maxClaims = 0 }) {
  if (!id || !name) throw new Error('Campaign id and name are required');
  if (currency.toLowerCase() !== 'usd') throw new Error('Campaign currency must be USD');
  if (!Number.isSafeInteger(budgetCents) || budgetCents < 100) throw new Error('Campaign budget must be at least $1.00');
  if (!sponsoredDisclosure) throw new Error('Sponsored campaigns must remain disclosed');
  if (!Number.isInteger(maxClaims) || maxClaims < 0) throw new Error('maxClaims must be a non-negative integer');
  return Object.freeze({ id: String(id), name: String(name).slice(0, 120), budgetCents, currency: 'usd', splitBps: validateSplitBps(split), sponsoredDisclosure: true, maxClaims });
}

export function quoteSponsoredClaim({ campaign, claimCents = 150 }) {
  if (!campaign?.id) throw new Error('Campaign is required');
  const allocation = allocateCampaignCents(claimCents, campaign.splitBps);
  if (allocation.amountCents > campaign.budgetCents) throw new Error('Campaign budget is insufficient for this claim');
  return Object.freeze({ campaignId: campaign.id, claimCents, ...allocation, disclosed: true, settlement: 'pending-verification' });
}
