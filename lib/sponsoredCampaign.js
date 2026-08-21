import { validateRevenueSplit, calculateRevenueAllocation } from '@/lib/sponsoredDrops';

export function createCampaign(config = {}) {
  const split = config.split || {};
  if (!validateRevenueSplit(split)) throw new Error('Revenue split must be non-negative basis points totaling no more than 10000');
  return {
    id: config.id,
    title: config.title || 'Vault Drop',
    sponsor: config.sponsor || null,
    disclosure: config.disclosure || 'Sponsored',
    format: config.format || 'hybrid',
    split,
    currency: 'USD',
    budgetCents: Math.max(0, Math.round(Number(config.budgetCents) || 0)),
  };
}

export function campaignPreview(campaign, amountCents) {
  return calculateRevenueAllocation(Number(amountCents) / 100, campaign?.split || {});
}
