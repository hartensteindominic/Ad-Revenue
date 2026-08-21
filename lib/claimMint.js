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

async function confirmClaimSettlement({ dropId, walletAddress, claimTicket, txHash, tokenId }) {
  const response = await fetch('/api/drops/claim/settle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ dropId, walletAddress, claimTicket, txHash, tokenId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Claim settlement unavailable (${response.status})`);
    error.code = 'CLAIM_SETTLEMENT_UNVERIFIED';
    error.details = data;
    throw error;
  }
  return data;
}

/**
 * After server issues a claim ticket, mint the NFT to the claimer's wallet.
 * Gas is paid in ETH on the configured chain. Ownership becomes real on-chain
 * after confirmation; the server then independently verifies and finalizes the
 * reservation so application state cannot drift from chain state.
 */
export async function mintClaimOnEthereum({ collectible, claimTicket, dropId, royaltyBps = 500 }) {
  if (!hasNftContract()) {
    throw new Error(
      `NFT contract not configured. Set NEXT_PUBLIC_VOXEL_NFT_ADDRESS and connect to ${EVM_CHAIN_NAME}.`
    );
  }
  if (!claimTicket) throw new Error('Server claim ticket is required before minting.');
  if (!dropId) throw new Error('Drop id is required before minting.');

  const uri = buildClaimMetadataUri({ collectible, claimTicket, dropId });
  const result = await mintCollectible({ uri, royaltyBps });

  if (result.status !== 'confirmed') {
    return {
      ...result,
      claimTicket,
      dropId,
      ownershipGranted: false,
      claimSettlementVerified: false,
      message: `Mint submitted on ${EVM_CHAIN_NAME}. Wait for confirmation before finalizing the claim.`,
    };
  }

  try {
    const settlement = await confirmClaimSettlement({
      dropId,
      walletAddress: result.owner,
      claimTicket,
      txHash: result.hash,
      tokenId: result.tokenId,
    });

    return {
      ...result,
      claimTicket,
      dropId,
      ownershipGranted: true,
      claimSettlementVerified: true,
      serverClaim: settlement.claim,
      message: `Minted on ${EVM_CHAIN_NAME}. Token ${result.tokenId || 'pending'} is owned by your wallet and the claim is server-verified.`,
    };
  } catch (error) {
    // The NFT is already on-chain. Do not falsely report a failed mint. Instead,
    // surface the server-finalization gap so the caller can retry settlement.
    return {
      ...result,
      claimTicket,
      dropId,
      ownershipGranted: true,
      claimSettlementVerified: false,
      settlementError: error?.message || 'Claim settlement verification failed',
      message: `Mint confirmed on ${EVM_CHAIN_NAME}, but the server has not finalized the claim yet. Retry claim settlement before treating the drop record as complete.`,
    };
  }
}
