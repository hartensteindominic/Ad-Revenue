/**
 * Ownership helpers — chain is authority when contracts are configured.
 */

import { BrowserProvider, Contract } from 'ethers';
import { NFT_ABI, NFT_ADDRESS, hasContracts, getWallet } from './blockchain';
import { getInjectedProvider } from './wallet-connect';

export async function getNftBalance(address) {
  if (!hasContracts() || !address) return { configured: false, balance: 0 };
  const ethereum = getInjectedProvider();
  if (!ethereum) return { configured: true, balance: null, error: 'No wallet provider' };
  const provider = new BrowserProvider(ethereum);
  const nft = new Contract(NFT_ADDRESS, NFT_ABI, provider);
  const balance = await nft.balanceOf(address);
  return { configured: true, balance: Number(balance), contract: NFT_ADDRESS };
}

export async function getTokenOwner(tokenId) {
  if (!hasContracts()) return { configured: false, owner: null };
  const ethereum = getInjectedProvider();
  if (!ethereum) return { configured: true, owner: null, error: 'No wallet provider' };
  const provider = new BrowserProvider(ethereum);
  const nft = new Contract(NFT_ADDRESS, NFT_ABI, provider);
  const owner = await nft.ownerOf(tokenId);
  return { configured: true, owner, tokenId };
}

/**
 * Mint a metadata URI via marketplace mintAndList or direct mint when available.
 * Returns receipt — caller must treat pre-receipt state as pending only.
 */
export async function mintCollectibleUri(uri, royaltyPercent = 5) {
  if (!hasContracts()) {
    throw new Error('Contracts are not configured. Ownership cannot be minted on-chain yet.');
  }
  const { mintAndList } = await import('./blockchain');
  // Use a symbolic list price of 0 path is not available; mintAndList requires price.
  // For claim mints, use minimal price listing the claimant can ignore / delist later,
  // or extend the contract later with mintOnly. For now mintAndList at a dust price.
  return mintAndList({ uri, royaltyPercent, priceEth: '0.001' });
}

export function ownershipLabel({ chainConfirmed, pending, demo }) {
  if (chainConfirmed) return 'Owned on-chain';
  if (pending) return 'Pending chain confirmation';
  if (demo) return 'Demo only — not ownership';
  return 'Not owned';
}
