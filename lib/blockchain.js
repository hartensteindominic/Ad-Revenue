import { BrowserProvider, Contract, parseEther } from 'ethers';
import { getInjectedProvider, getMetaMaskDeepLink } from './wallet-connect';

// Keep collector transactions on Sepolia until the deployed NFTVerse/Voxel Vault
// contract interface, mint fee, metadata URI and transaction simulation are verified.
// Production can be selected explicitly with environment variables after verification.
export const EVM_CHAIN_ID = process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '0xaa36a7';
export const EVM_CHAIN_ID_DECIMAL = BigInt(EVM_CHAIN_ID);
export const EVM_CHAIN_NAME = process.env.NEXT_PUBLIC_EVM_CHAIN_NAME || 'Sepolia';
export const EVM_NATIVE_SYMBOL = process.env.NEXT_PUBLIC_EVM_NATIVE_SYMBOL || 'ETH';
export const EVM_EXPLORER_URL = process.env.NEXT_PUBLIC_EVM_EXPLORER_URL || 'https://sepolia.etherscan.io';

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
  'function refundExpiredOffer(uint256 tokenId)',
  'function acceptOffer(uint256 tokenId)',
  'function startAuction(uint256 tokenId,uint256 reservePrice,uint256 durationSeconds)',
  'function bid(uint256 tokenId) payable',
  'function settleAuction(uint256 tokenId)',
  'function withdraw()',
  'function listings(uint256 tokenId) view returns (address seller,uint256 price)',
  'function offers(uint256 tokenId) view returns (address buyer,uint256 amount,uint256 expiresAt)',
  'function auctions(uint256 tokenId) view returns (address seller,uint256 reservePrice,uint256 endAt,address highestBidder,uint256 highestBid,bool settled)'
];

export function hasContracts() {
  return Boolean(NFT_ADDRESS && MARKET_ADDRESS);
}

export function explorerTxUrl(hash) {
  return hash ? `${EVM_EXPLORER_URL}/tx/${hash}` : '';
}

async function ensureNetwork(ethereum) {
  let chainId = await ethereum.request({ method: 'eth_chainId' });
  if (chainId?.toLowerCase() === EVM_CHAIN_ID.toLowerCase()) return chainId;

  try {
    await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: EVM_CHAIN_ID }] });
  } catch (error) {
    if (error?.code !== 4902) throw new Error(`Please switch MetaMask to ${EVM_CHAIN_NAME}.`);
    const rpcUrl = process.env.NEXT_PUBLIC_EVM_RPC_URL;
    if (!rpcUrl) throw new Error(`Please switch MetaMask to ${EVM_CHAIN_NAME}.`);

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: EVM_CHAIN_ID,
        chainName: EVM_CHAIN_NAME,
        nativeCurrency: { name: EVM_NATIVE_SYMBOL, symbol: EVM_NATIVE_SYMBOL, decimals: 18 },
        rpcUrls: [rpcUrl],
        blockExplorerUrls: [EVM_EXPLORER_URL]
      }]
    });
  }

  chainId = await ethereum.request({ method: 'eth_chainId' });
  if (chainId?.toLowerCase() !== EVM_CHAIN_ID.toLowerCase()) throw new Error(`Please switch MetaMask to ${EVM_CHAIN_NAME}.`);
  return chainId;
}

export async function getWallet() {
  if (typeof window === 'undefined') throw new Error('Wallet connections are available in the browser only.');
  const ethereum = getInjectedProvider();
  if (!ethereum) {
    const error = new Error('MetaMask was not detected. Open Voxel Vault in MetaMask Mobile or install MetaMask.');
    error.code = 'NO_WALLET_PROVIDER';
    error.deepLink = getMetaMaskDeepLink();
    throw error;
  }

  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  if (!accounts?.length) throw new Error('Wallet connection was cancelled.');
  const chainId = await ensureNetwork(ethereum);
  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner(accounts[0]);
  return { provider, signer, address: await signer.getAddress(), chainId };
}

export async function getWalletStatus() {
  if (typeof window === 'undefined') return { installed: false, connected: false, networkOk: false };
  const ethereum = getInjectedProvider();
  if (!ethereum) return { installed: false, connected: false, networkOk: false, deepLink: getMetaMaskDeepLink() };
  try {
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return {
      installed: true,
      connected: accounts.length > 0,
      address: accounts[0] || '',
      networkOk: chainId?.toLowerCase() === EVM_CHAIN_ID.toLowerCase(),
      chainId,
      chainName: EVM_CHAIN_NAME
    };
  } catch {
    return { installed: true, connected: false, networkOk: false, chainName: EVM_CHAIN_NAME };
  }
}

export async function mintAndList({ uri, royaltyPercent, priceEth }) {
  if (!hasContracts()) throw new Error('Voxel Vault contracts are not configured yet.');
  const { signer } = await getWallet();
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
  const tx = await market.mintAndList(uri, Math.round(Number(royaltyPercent) * 100), parseEther(priceEth));
  return tx.wait();
}

export async function buyAsset(tokenId, priceEth) {
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured.');
  const { signer, provider } = await getWallet();
  const market = new Contract(MARKET_ADDRESS, MARKET_ABI, signer);
  const listing = await market.listings(tokenId);
  const listedPrice = listing?.[1];
  if (!listedPrice || listedPrice <= 0n) throw new Error('This item is not currently listed on-chain.');

  // Never trust a client catalog price for the transaction value. The contract is authoritative.
  const catalogPrice = priceEth ? parseEther(String(priceEth)) : null;
  if (catalogPrice && catalogPrice !== listedPrice) {
    const listedEth = Number(listedPrice) / 1e18;
    console.warn(`Catalog price ${priceEth} ETH differs from on-chain listing ${listedEth} ETH. Using the on-chain price.`);
  }

  await provider.getFeeData();
  const tx = await market.buy(tokenId, { value: listedPrice });
  return tx.wait();
}

export async function makeOffer(tokenId, amountEth, durationHours = 24) {
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured.');
  const { signer } = await getWallet();
  const expires = Math.floor(Date.now() / 1000) + Math.max(1, Number(durationHours)) * 3600;
  const tx = await new Contract(MARKET_ADDRESS, MARKET_ABI, signer).makeOffer(tokenId, expires, { value: parseEther(amountEth) });
  return tx.wait();
}

export async function bidOnAuction(tokenId, amountEth) {
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured.');
  const { signer } = await getWallet();
  const tx = await new Contract(MARKET_ADDRESS, MARKET_ABI, signer).bid(tokenId, { value: parseEther(amountEth) });
  return tx.wait();
}

export async function startAuction(tokenId, reserveEth, durationSeconds = 86400) {
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured.');
  const { signer } = await getWallet();
  const tx = await new Contract(MARKET_ADDRESS, MARKET_ABI, signer).startAuction(tokenId, parseEther(reserveEth), durationSeconds);
  return tx.wait();
}

export async function settleAuction(tokenId) {
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured.');
  const { signer } = await getWallet();
  const tx = await new Contract(MARKET_ADDRESS, MARKET_ABI, signer).settleAuction(tokenId);
  return tx.wait();
}

export async function withdrawFunds() {
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured.');
  const { signer } = await getWallet();
  const tx = await new Contract(MARKET_ADDRESS, MARKET_ABI, signer).withdraw();
  return tx.wait();
}

function readContract() {
  if (typeof window === 'undefined') throw new Error('Browser wallet required.');
  const ethereum = getInjectedProvider();
  if (!ethereum) throw new Error('Open Voxel Vault in MetaMask Mobile to read on-chain marketplace data.');
  if (!MARKET_ADDRESS) throw new Error('Marketplace contract is not configured.');
  return new Contract(MARKET_ADDRESS, MARKET_ABI, new BrowserProvider(ethereum));
}

export async function getListing(tokenId) {
  if (!MARKET_ADDRESS) return null;
  const x = await readContract().listings(tokenId);
  return { seller: x[0], price: x[1] };
}

export async function getOffer(tokenId) {
  if (!MARKET_ADDRESS) return null;
  const x = await readContract().offers(tokenId);
  return { buyer: x[0], amount: x[1], expiresAt: Number(x[2]) };
}

export async function getAuction(tokenId) {
  if (!MARKET_ADDRESS) return null;
  const x = await readContract().auctions(tokenId);
  return { seller: x[0], reservePrice: x[1], endAt: Number(x[2]), highestBidder: x[3], highestBid: x[4], settled: x[5] };
}
