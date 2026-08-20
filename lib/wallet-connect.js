const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_HEX_CHAIN_ID = SEPOLIA_CHAIN_ID;

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

export function getMetaMaskDeepLink(url) {
  const source = url || (typeof window !== 'undefined' ? window.location.href : '');
  const clean = String(source).replace(/^https?:\/\//, '');
  return clean ? `https://metamask.app.link/dapp/${clean}` : 'https://metamask.io/download/';
}

export async function switchToSepolia(provider) {
  if (!provider) return { ok: false, message: 'Wallet provider unavailable.' };
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }] });
    return { ok: true, chainId: SEPOLIA_HEX_CHAIN_ID };
  } catch (error) {
    if (error?.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_HEX_CHAIN_ID,
            chainName: 'Sepolia',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io']
          }]
        });
        return { ok: true, chainId: SEPOLIA_HEX_CHAIN_ID };
      } catch (addError) {
        return { ok: false, message: addError?.message || 'Could not add Sepolia to your wallet.' };
      }
    }
    if (error?.code === 4001) return { ok: false, message: 'Network change was cancelled in your wallet.' };
    return { ok: false, message: error?.message || 'Could not switch to Sepolia.' };
  }
}

export async function connectWallet({ requireSepolia = true } = {}) {
  const provider = getInjectedProvider();
  if (!provider) {
    const deepLink = getMetaMaskDeepLink();
    return {
      ok: false,
      reason: 'no-provider',
      deepLink,
      message: isMetaMaskMobile()
        ? 'MetaMask is open, but no wallet provider is available yet. Reload Voxel Vault inside MetaMask.'
        : 'MetaMask is not installed here. Open Voxel Vault in MetaMask Mobile to connect your wallet.'
    };
  }

  try {
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const address = accounts?.[0] || '';
    if (!address) return { ok: false, reason: 'cancelled', message: 'Wallet connection cancelled.' };

    let chainId = await provider.request({ method: 'eth_chainId' });
    if (requireSepolia && chainId?.toLowerCase() !== SEPOLIA_CHAIN_ID) {
      const switched = await switchToSepolia(provider);
      if (!switched.ok) return { ok: false, reason: 'wrong-network', address, chainId, ...switched, provider };
      chainId = switched.chainId;
    }

    return { ok: true, address, chainId, provider, network: 'Sepolia' };
  } catch (error) {
    if (error?.code === 4001) return { ok: false, reason: 'rejected', message: 'Connection was cancelled in your wallet.' };
    return { ok: false, reason: 'error', message: error?.message || 'Wallet connection failed.' };
  }
}

export { SEPOLIA_CHAIN_ID };
