export const MAINNET_CHAIN_ID = '0x1';
export const MAINNET_CHAIN_HEX = MAINNET_CHAIN_ID;

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
  return /MetaMaskMobile/i.test(navigator.userAgent || '');
}

export function getMetaMaskDeepLink(url = typeof window !== 'undefined' ? window.location.href : '') {
  const clean = String(url).replace(/^https?:\/\//, '');
  return clean ? `https://metamask.app.link/dapp/${clean}` : '';
}

async function switchToMainnet(provider) {
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: MAINNET_CHAIN_ID }] });
    return true;
  } catch (error) {
    if (error?.code !== 4902) throw error;
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: MAINNET_CHAIN_ID,
        chainName: 'Ethereum Mainnet',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://cloudflare-eth.com'],
        blockExplorerUrls: ['https://etherscan.io']
      }]
    });
    return true;
  }
}

export async function connectWallet({ requireMainnet = true } = {}) {
  const provider = getInjectedProvider();
  if (!provider) {
    return {
      ok: false,
      reason: 'no-provider',
      deepLink: getMetaMaskDeepLink(),
      message: 'No wallet provider is open in this browser. Opening Voxel Vault in MetaMask Mobile…'
    };
  }

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0] || '';
    if (!address) return { ok: false, reason: 'cancelled', message: 'Wallet connection cancelled.' };

    let chainId = await provider.request({ method: 'eth_chainId' });
    if (requireMainnet && chainId !== MAINNET_CHAIN_ID) {
      await switchToMainnet(provider);
      chainId = await provider.request({ method: 'eth_chainId' });
    }

    return { ok: true, address, chainId, provider };
  } catch (error) {
    if (error?.code === 4001) {
      return { ok: false, reason: 'rejected', message: 'Connection was cancelled in your wallet.' };
    }
    return { ok: false, reason: 'error', message: error?.message || 'Wallet connection failed.' };
  }
}
