export function usdCentsToDisplay(cents) {
  const value = Number(cents);
  if (!Number.isFinite(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Math.max(0, value) / 100);
}

export function displayUsdFromEth(eth, usdPerEth) {
  const e = Number(eth);
  const rate = Number(usdPerEth);
  if (!Number.isFinite(e) || !Number.isFinite(rate) || e < 0 || rate < 0) return null;
  return usdCentsToDisplay(Math.round(e * rate * 100));
}

export function normalizePrice({ usdCents, cryptoAmount, cryptoSymbol, usdPerCrypto } = {}) {
  const usd = Number.isFinite(Number(usdCents)) ? Math.max(0, Math.round(Number(usdCents))) : null;
  const crypto = Number(cryptoAmount);
  const rate = Number(usdPerCrypto);
  return {
    usdCents: usd,
    usdDisplay: usd == null ? null : usdCentsToDisplay(usd),
    cryptoAmount: Number.isFinite(crypto) ? crypto : null,
    cryptoSymbol: cryptoSymbol || null,
    exchangeRate: Number.isFinite(rate) ? rate : null,
  };
}
