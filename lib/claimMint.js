/**
 * Build metadata URI + mint claimed drop collectibles on Ethereum (Sepolia by default).
 */

import { mintCollectible, hasNftContract, EVM_CHAIN_NAME } from './blockchain';

export function buildClaimMetadataUri({ collectible, claimTicket, dropId }) {
  const payload = {
    name: collectible?.name || 'Voxel Vault Collectible',
    description:
      collectible?.description ||
      `${collectible?.name || 'Collectible'} claimed from Voxel Drop ${dropId || ''}. ` +
        `Reality basis: ${collectible?.realityBasis?.inspiredBy || 'n/a'}.`,
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

  // data: URI keeps mint self-contained without requiring IPFS during claim.
  // Production can replace with IPFS/Arweave upload later.
  const json = JSON.stringify(payload);
  if (typeof window !== 'undefined' && typeof btoa === 'function') {
    return `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
  }
  return `data:application/json,${encodeURIComponent(json)}`;
}

/**
 * After server issues a claim ticket, mint the NFT to the claimer's wallet.
 * Gas is paid in ETH on the configured chain.
 */
export async function mintClaimOnEthereum({ collectible, claimTicket, dropId, royaltyBps = 500 }) {
  if (!hasNftContract()) {
    throw new Error(
      `NFT contract not configured. Set NEXT_PUBLIC_VOXEL_NFT_ADDRESS and connect to ${EVM_CHAIN_NAME}.`
    );
  }
  if (!claimTicket) throw new Error('Server claim ticket is required before minting.');

  const uri = buildClaimMetadataUri({ collectible, claimTicket, dropId });
  const result = await mintCollectible({ uri, royaltyBps });
  return {
    ...result,
    claimTicket,
    dropId,
    ownershipGranted: result.status === 'confirmed',
    message:
      result.status === 'confirmed'
        ? `Minted on ${EVM_CHAIN_NAME}. Token ${result.tokenId || 'pending'} is owned by your wallet.`
        : `Mint submitted on ${EVM_CHAIN_NAME}. Wait for confirmation.`,
  };
}
