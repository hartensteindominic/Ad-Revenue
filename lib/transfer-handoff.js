export function buildTransferHandoff({ chainId, contract, tokenId, sender }) {
  if (!chainId || !contract || tokenId === undefined || tokenId === null) {
    throw new Error('A complete collectible identity is required.');
  }

  return {
    version: 1,
    action: 'transfer',
    chainId: String(chainId),
    contract: String(contract),
    tokenId: String(tokenId),
    sender: sender || null
  };
}

export function encodeTransferHandoff(payload) {
  const json = JSON.stringify(payload);
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(unescape(encodeURIComponent(json)));
  }
  return Buffer.from(json, 'utf8').toString('base64url');
}

export function createTransferLink(payload, origin = '') {
  const encoded = encodeTransferHandoff(payload);
  return `${origin || ''}/transfer?payload=${encodeURIComponent(encoded)}`;
}
