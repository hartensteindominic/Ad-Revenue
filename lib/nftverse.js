export const NFTVERSE_SEPOLIA_ADDRESS = '0x02f93c7547309ca50EEAB446DaEBE8ce8E694cBb';
export const SEPOLIA_CHAIN_ID = 11155111;
export const NFTVERSE_MINT_FEE_WEI = '10000000000000000';

export const NFTVERSE_ABI = [
  'function mint(address to, string uri) payable returns (uint256)',
  'function mintFee() view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function balanceOf(address owner) view returns (uint256)',
  'event NFTMinted(uint256 indexed tokenId, address indexed creator, string uri)'
];

export function getEthereum() {
  if (typeof window === 'undefined') return null;
  return window.ethereum ?? null;
}

export async function ensureSepolia() {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error('Open VoxelVault in a wallet browser such as MetaMask Mobile.');

  const current = await ethereum.request({ method: 'eth_chainId' });
  if (Number.parseInt(current, 16) === SEPOLIA_CHAIN_ID) return;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }]
    });
  } catch (error) {
    if (error?.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0xaa36a7',
          chainName: 'Sepolia',
          nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: ['https://rpc.sepolia.org'],
          blockExplorerUrls: ['https://sepolia.etherscan.io']
        }]
      });
    } else {
      throw error;
    }
  }
}

export function buildMetadata({ name, description, category, price, scene, assetUrl }) {
  return {
    name: name.trim(),
    description: description.trim(),
    category,
    displayPrice: price,
    assetUrl: assetUrl?.trim() || undefined,
    scene,
    createdWith: 'Voxel Vault',
    collection: 'NFTVerse / HyperStream 3D',
    chain: 'Sepolia',
    contract: NFTVERSE_SEPOLIA_ADDRESS,
    version: 1
  };
}
