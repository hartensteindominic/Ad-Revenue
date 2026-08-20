export const TRADE_STATES = ['draft', 'pending', 'accepted', 'submitted', 'confirmed', 'rejected', 'cancelled', 'expired', 'failed'];

function normalizeAddress(address) {
  return typeof address === 'string' ? address.trim().toLowerCase() : '';
}

function normalizeExpiry(expiresAt) {
  if (expiresAt === null || expiresAt === undefined || expiresAt === '') return null;
  const value = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  if (!Number.isFinite(value)) throw new Error('Trade expiry must be a valid date');
  if (value <= Date.now()) throw new Error('Trade expiry must be in the future');
  return new Date(value).toISOString();
}

export function createTradeOffer({ offerer, recipient, offered = [], requested = [], expiresAt = null } = {}) {
  const from = normalizeAddress(offerer);
  const to = normalizeAddress(recipient);
  if (!from) throw new Error('Offerer wallet is required');
  if (!to) throw new Error('Recipient wallet is required');
  if (from === to) throw new Error('Offerer and recipient must be different wallets');
  if (!Array.isArray(offered) || !Array.isArray(requested)) throw new Error('Trade assets must be arrays');
  if (!offered.length && !requested.length) throw new Error('Trade must contain an offered or requested asset');

  return {
    schema: 'voxel-vault/trade-offer',
    version: '1.0.0',
    id: null,
    state: 'pending',
    offerer: from,
    recipient: to,
    offered: [...offered],
    requested: [...requested],
    expiresAt: normalizeExpiry(expiresAt),
    createdAt: new Date().toISOString(),
  };
}

export function isTradeExpired(offer, now = new Date()) {
  if (!offer?.expiresAt) return false;
  const expiry = new Date(offer.expiresAt).getTime();
  return !Number.isFinite(expiry) || new Date(now).getTime() >= expiry;
}

export function canAcceptTrade(offer, acceptingWallet, now = new Date()) {
  if (!offer || offer.state !== 'pending' || isTradeExpired(offer, now)) return false;
  return normalizeAddress(offer.recipient) === normalizeAddress(acceptingWallet);
}

export function transitionTrade(offer, nextState, now = new Date()) {
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
  if (nextState === 'accepted' && isTradeExpired(offer, now)) {
    throw new Error('Expired trades cannot be accepted');
  }
  if (!allowed[offer.state]?.includes(nextState)) {
    throw new Error(`Invalid trade transition: ${offer.state} -> ${nextState}`);
  }
  return { ...offer, state: nextState, updatedAt: new Date(now).toISOString() };
}
