const CHAINS = Object.freeze({
  ethereum: { id: 1, label: 'Ethereum' },
  base: { id: 8453, label: 'Base' },
  arbitrum: { id: 42161, label: 'Arbitrum' },
  optimism: { id: 10, label: 'Optimism' },
});

export function createBridgePreview({ tokenId, from, to } = {}) {
  if (!Number.isInteger(Number(tokenId)) || Number(tokenId) < 1) throw new Error('Invalid tokenId');
  if (!CHAINS[from] || !CHAINS[to] || from === to) throw new Error('Invalid bridge route');
  return {
    tokenId: Number(tokenId),
    from,
    to,
    status: 'preview-only',
    requiresAuditedProvider: true,
    requiresExplicitConfirmation: true,
    replayProtectionRequired: true,
    destinationVerificationRequired: true,
    userFundsLocked: false,
  };
}

export function listBridgeChains() {
  return Object.entries(CHAINS).map(([key, value]) => ({ key, ...value }));
}
