const TERMINAL = new Set(['paid']);
const TRANSITIONS = {
  pending: new Set(['claimable']),
  claimable: new Set(['paid']),
  paid: new Set(),
};

export function transitionReward(record, nextStatus) {
  if (!record?.id) throw new Error('Reward record is required');
  const current = record.status || 'pending';
  if (!TRANSITIONS[current]?.has(nextStatus)) throw new Error(`Invalid reward transition: ${current} -> ${nextStatus}`);
  return { ...record, status: nextStatus, updatedAt: new Date().toISOString() };
}

export function reconcileReward(record, verification = {}) {
  if (!record || record.status !== 'pending') return { record, changed: false, reason: 'not-pending' };
  if (verification.paymentVerified !== true) return { record, changed: false, reason: 'payment-not-verified' };
  if (verification.campaignActive !== true) return { record, changed: false, reason: 'campaign-not-active' };
  if (verification.amountCents !== record.amountCents) return { record, changed: false, reason: 'amount-mismatch' };
  if (verification.currency && verification.currency.toLowerCase() !== 'usd') return { record, changed: false, reason: 'currency-mismatch' };
  return { record: transitionReward(record, 'claimable'), changed: true, reason: 'reconciled' };
}

export function canPayReward(record) {
  return Boolean(record && record.status === 'claimable' && Number.isInteger(record.amountCents) && record.amountCents > 0 && !TERMINAL.has(record.status));
}
