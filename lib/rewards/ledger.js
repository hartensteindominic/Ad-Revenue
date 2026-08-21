export function cents(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid USD amount');
  return Math.round(n * 100);
}

export function splitCents(totalCents, splits) {
  if (!Number.isInteger(totalCents) || totalCents < 0) throw new Error('Invalid total cents');
  const entries = Object.entries(splits || {});
  const weights = entries.reduce((sum, [, value]) => sum + Number(value), 0);
  if (!entries.length || !Number.isFinite(weights) || weights <= 0) throw new Error('Invalid reward split');
  const result = {};
  let assigned = 0;
  entries.forEach(([key, weight], index) => {
    const amount = index === entries.length - 1 ? totalCents - assigned : Math.floor(totalCents * Number(weight) / weights);
    result[key] = amount;
    assigned += amount;
  });
  return result;
}

export function rewardEvent({ id, campaignId, paymentId, collector, amountCents, currency = 'usd', status = 'pending' }) {
  if (!id || !campaignId || !paymentId || !collector) throw new Error('Reward event identifiers are required');
  if (!Number.isInteger(amountCents) || amountCents < 0) throw new Error('Reward amount must be integer cents');
  return { id, campaignId, paymentId, collector, amountCents, currency: currency.toLowerCase(), status, createdAt: new Date().toISOString() };
}
