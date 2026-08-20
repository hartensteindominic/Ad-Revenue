export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function getInjectedProvider() {
  if (typeof window === 'undefined') return null;
  const eth = window.ethereum;
  if (!eth) return null;
  if (eth.providers?.length) {
    const metamask = eth.providers.find((provider) => provider.isMetaMask);
    return metamask || eth.providers[0];
  }
  return eth;
}

export function isMetaMaskMobile() {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /MetaMaskMobile/i.test(ua);
}

export function getMetaMaskDeepLink(url = window.location.href) {
  const clean = String(url).replace(/^https?:\/\//, '');
  return `https://metamask.app.link/dapp/${clean}`;
}

export async function connectWallet() {
  const provider = getInjectedProvider();
  if (!provider) {
    const deepLink = getMetaMaskDeepLink();
    return {
      ok: false,
      reason: 'no-provider',
      deepLink,
      message: 'Open Voxel Vault in MetaMask Mobile to connect your wallet.'
    };
  }

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0] || '';
    if (!address) {
      return { ok: false, reason: 'cancelled', message: 'Wallet connection cancelled.' };
    }

    const chainId = await provider.request({ method: 'eth_chainId' });
    return { ok: true, address, chainId, provider };
  } catch (error) {
    if (error?.code === 4001) {
      return { ok: false, reason: 'rejected', message: 'Connection was cancelled in your wallet.' };
    }
    return {
      ok: false,
      reason: 'error',
      message: error?.message || 'Wallet connection failed.'
    };
  }
}
