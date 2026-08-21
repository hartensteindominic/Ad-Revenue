export function rewardEventKey({ paymentId, campaignId, collector }) {
  if (!paymentId || !campaignId || !collector) throw new Error('Missing reward event identity');
  return `${paymentId}:${campaignId}:${collector}`;
}

export function canCreditReward(event, existingKeys = new Set()) {
  const key = rewardEventKey(event);
  if (event.status !== 'verified') return { ok: false, key, reason: 'payment-not-verified' };
  if (existingKeys.has(key)) return { ok: false, key, reason: 'already-credited' };
  return { ok: true, key };
}
