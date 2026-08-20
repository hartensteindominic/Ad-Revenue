export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const SEPOLIA_CHAIN_HEX = SEPOLIA_CHAIN_ID;

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

async function switchToSepolia(provider) {
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
    return true;
  } catch (error) {
    if (error?.code !== 4902) throw error;

    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: SEPOLIA_CHAIN_ID,
        chainName: 'Sepolia',
        nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://rpc.sepolia.org'],
        blockExplorerUrls: ['https://sepolia.etherscan.io']
      }]
    });
    return true;
  }
}

export async function connectWallet({ requireSepolia = true } = {}) {
  const provider = getInjectedProvider();
  if (!provider) {
    return {
      ok: false,
      reason: 'no-provider',
      deepLink: getMetaMaskDeepLink(),
      message: 'MetaMask is not open in this browser. Opening Voxel Vault in MetaMask Mobile…'
    };
  }

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0] || '';
    if (!address) return { ok: false, reason: 'cancelled', message: 'Wallet connection cancelled.' };

    let chainId = await provider.request({ method: 'eth_chainId' });
    if (requireSepolia && chainId !== SEPOLIA_CHAIN_ID) {
      await switchToSepolia(provider);
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
