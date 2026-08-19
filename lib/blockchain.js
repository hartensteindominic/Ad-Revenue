import { BrowserProvider, Contract, parseEther } from 'ethers';

export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const NFT_ADDRESS = process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS || '';
export const MARKET_ADDRESS = process.env.NEXT_PUBLIC_VOXEL_MARKET_ADDRESS || '';

export const NFT_ABI = [
  'function mint(string uri,uint96 royaltyBps) returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function approve(address to,uint256 tokenId)',
  'function setApprovalForAll(address operator,bool approved)',
  'function balanceOf(address owner) view returns (uint256)'
];

export const MARKET_ABI = [
  'function mintAndList(string uri,uint96 royaltyBps,uint256 price) returns (uint256)',
  'function list(uint256 tokenId,uint256 price)',
  'function buy(uint256 tokenId) payable',
  'function delist(uint256 tokenId)',
  'function makeOffer(uint256 tokenId,uint256 expiresAt) payable',
  'function cancelOffer(uint256 tokenId)',
  'function acceptOffer(uint256 tokenId)',
  'function startAuction(uint256 tokenId,uint256 reservePrice,uint256 durationSeconds)',
  'function bid(uint256 tokenId) payable',
  'function settleAuction(uint256 tokenId)',
  'function withdraw()',
  'function listings(uint256 tokenId) view returns (address seller,uint256 price)',
  'function offers(uint256 tokenId) view returns (address buyer,uint256 amount,uint256 expiresAt)',
  'function auctions(uint256 tokenId) view returns (address seller,uint256 reservePrice,uint256 endAt,address highestBidder,uint256 highestBid,bool settled)'
];

export function hasContracts() { return Boolean(NFT_ADDRESS && MARKET_ADDRESS); }

export async function getWallet() {
  if (!window.ethereum) throw new Error('MetaMask is not installed.');
  const provider = new BrowserProvider(window.ethereum);
  const network = await provider.getNetwork();
  if (network.chainId !== 11155111n) {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: SEPOLIA_CHAIN_ID }] });
  }
  const signer = await provider.getSigner();
  return { provider, signer, address: await signer.getAddress() };
}

export async function mintAndList({ uri, royaltyPercent, priceEth }) {
  const { signer } = await getWallet();
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured yet.');
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
  const tx = await market.mintAndList(uri, Math.round(Number(royaltyPercent) * 100), parseEther(priceEth));
  return tx.wait();
}

export async function buyAsset(tokenId, priceEth) {
  const { signer } = await getWallet();
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured yet.');
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
  const tx = await market.buy(tokenId, { value: parseEther(priceEth) });
  return tx.wait();
}

export async function makeOffer(tokenId, amountEth, durationHours = 24) {
  const { signer } = await getWallet();
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured yet.');
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
  const expires = Math.floor(Date.now() / 1000) + Math.max(1, durationHours) * 3600;
  const tx = await market.makeOffer(tokenId, expires, { value: parseEther(amountEth) });
  return tx.wait();
}

export async function bidOnAuction(tokenId, amountEth) {
  const { signer } = await getWallet();
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured yet.');
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
  const tx = await market.bid(tokenId, { value: parseEther(amountEth) });
  return tx.wait();
}
