/**
 * Build metadata URI + mint claimed drop collectibles on Ethereum (Sepolia by default).
 */

import { mintCollectible, hasNftContract, EVM_CHAIN_NAME } from './blockchain.js';

export function buildClaimMetadataUri({ collectible, claimTicket, dropId }) {
  const payload = {
    name: collectible?.name || 'Voxel Vault Collectible',
    description: collectible?.description || `${collectible?.name || 'Collectible'} claimed from Voxel Drop ${dropId || ''}. Reality basis: ${collectible?.realityBasis?.inspiredBy || 'n/a'}.`,
    image: collectible?.asset?.previewUri || collectible?.asset?.thumbnailUri || undefined,
    animation_url: collectible?.asset?.uri || undefined,
    external_url: 'https://voxel-vault.vercel.app',
    attributes: [
      { trait_type: 'Family', value: collectible?.family || 'other' },
      { trait_type: 'Subtype', value: collectible?.subtype || 'object' },
      { trait_type: 'Rarity', value: collectible?.rarity || 'common' },
      { trait_type: 'Drop', value: dropId || 'unknown' },
      { trait_type: 'Claim Ticket', value: claimTicket || 'none' },
      { trait_type: 'Chain', value: EVM_CHAIN_NAME },
    ].filter((a) => a.value),
  };
  const json = JSON.stringify(payload);
  if (typeof window !== 'undefined' && typeof btoa === 'function') return `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
  return `data:application/json,${encodeURIComponent(json)}`;
}

/** Mint from a server reservation, then require server-side receipt verification before final ownership state. */
export async function mintClaimOnEthereum({ collectible, claimTicket, dropId, royaltyBps = 500 }) {
  if (!hasNftContract()) throw new Error(`NFT contract not configured. Set NEXT_PUBLIC_VOXEL_NFT_ADDRESS and connect to ${EVM_CHAIN_NAME}.`);
  if (!claimTicket) throw new Error('Server claim ticket is required before minting.');
  if (!dropId) throw new Error('Drop ID is required before minting.');

  const uri = buildClaimMetadataUri({ collectible, claimTicket, dropId });
  const result = await mintCollectible({ uri, royaltyBps });
  const walletAddress = result.owner;
  if (!walletAddress || !result.hash) throw new Error('Mint returned no authoritative wallet or transaction hash');

  const submitResponse = await fetch('/api/drops/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dropId, walletAddress, claimTicket, transactionHash: result.hash }),
  });
  const submitData = await submitResponse.json().catch(() => ({}));
  if (!submitResponse.ok) return { ...result, claimTicket, dropId, ownershipGranted: false, confirmationStatus: 'submitted_unrecorded', message: 'The mint confirmed on-chain, but the durable claim record could not be updated. Ownership is not finalized in Voxel Vault.', serverError: submitData.error || 'Durable claim submission failed' };

  const confirmResponse = await fetch('/api/drops/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dropId, walletAddress, claimTicket, transactionHash: result.hash }),
  });
  const confirmData = await confirmResponse.json().catch(() => ({}));
  if (!confirmResponse.ok || confirmData.ownershipGranted !== true) return { ...result, claimTicket, dropId, ownershipGranted: false, confirmationStatus: 'submitted_verification_failed', message: confirmData.error || 'Chain receipt verification did not finalize the reservation.' };

  return { ...result, ...confirmData.verification, claimTicket, dropId, ownershipGranted: true, confirmationStatus: 'confirmed', message: `Minted and verified on ${EVM_CHAIN_NAME}. Token ${confirmData.verification?.tokenId || result.tokenId || 'confirmed'} is owned by your wallet.` };
}
