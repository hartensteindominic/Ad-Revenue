export const TRADE_STATES = ['draft', 'pending', 'accepted', 'submitted', 'confirmed', 'rejected', 'cancelled', 'expired', 'failed'];

function normalizeAddress(address) {
  return typeof address === 'string' ? address.trim().toLowerCase() : '';
}

export function createTradeOffer({ offerer, recipient, offered = [], requested = [], expiresAt = null } = {}) {
  const from = normalizeAddress(offerer);
  const to = normalizeAddress(recipient);
  if (!from) throw new Error('Offerer wallet is required');
  if (!to) throw new Error('Recipient wallet is required');
  if (from === to) throw new Error('Offerer and recipient must be different wallets');
  if (!offered.length && !requested.length) throw new Error('Trade must contain an offered or requested asset');

  return {
    schema: 'voxel-vault/trade-offer',
    version: '1.0.0',
    id: null,
    state: 'pending',
    offerer: from,
    recipient: to,
    offered,
    requested,
    expiresAt,
    createdAt: new Date().toISOString(),
  };
}

export function canAcceptTrade(offer, acceptingWallet) {
  if (!offer || offer.state !== 'pending') return false;
  return normalizeAddress(offer.recipient) === normalizeAddress(acceptingWallet);
}

export function transitionTrade(offer, nextState) {
  if (!offer || !TRADE_STATES.includes(nextState)) throw new Error('Invalid trade state');
  const allowed = {
    pending: ['accepted', 'rejected', 'cancelled', 'expired'],
    accepted: ['submitted', 'cancelled'],
    submitted: ['confirmed', 'failed'],
    draft: ['pending', 'cancelled'],
    confirmed: [],
    rejected: [],
    cancelled: [],
    expired: [],
    failed: [],
  };
  if (!allowed[offer.state]?.includes(nextState)) {
    throw new Error(`Invalid trade transition: ${offer.state} -> ${nextState}`);
  }
  return { ...offer, state: nextState, updatedAt: new Date().toISOString() };
}
