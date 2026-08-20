export function createTradeOffer({ offerId, fromWallet, toWallet, offered = [], requested = [], expiresAt = null }) {
  if (!offerId || !fromWallet || !toWallet) throw new Error('Offer identity and wallets are required');
  return {
    version: 1,
    offerId,
    fromWallet,
    toWallet,
    offered: Array.isArray(offered) ? offered : [],
    requested: Array.isArray(requested) ? requested : [],
    expiresAt,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
}

export function canAcceptTrade(offer, acceptingWallet) {
  return Boolean(
    offer &&
    offer.status === 'pending' &&
    acceptingWallet &&
    acceptingWallet.toLowerCase() === String(offer.toWallet).toLowerCase()
  );
}
