export function calculateRevenueAllocation(amount, split = {}) {
  const cents = Math.max(0, Math.round(Number(amount) * 100));
  const participant = Math.floor(cents * Number(split.participantShareBps || 0) / 10000);
  const platform = Math.floor(cents * Number(split.platformShareBps || 0) / 10000);
  const discovery = Math.floor(cents * Number(split.discoveryPoolBps || 0) / 10000);
  return { totalCents: cents, participantCents: participant, platformCents: platform, discoveryPoolCents: discovery, unallocatedCents: cents - participant - platform - discovery };
}

export function createRevenueEvent({ campaignId, dropId, amount, split, currency = 'USD', status = 'pending' } = {}) {
  if (!campaignId || !dropId) throw new Error('Revenue events require campaignId and dropId');
  return { id: `rev_${campaignId}_${dropId}_${Date.now()}`, campaignId, dropId, currency, status, allocation: calculateRevenueAllocation(amount, split), createdAt: new Date().toISOString() };
}
