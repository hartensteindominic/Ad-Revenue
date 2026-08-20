/**
 * Claim metadata and signed-voucher redemption helpers.
 * Ownership is only granted after the NFT contract confirms the voucher redemption.
 */

import { redeemClaimVoucher, hasNftContract, EVM_CHAIN_NAME } from './blockchain';

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

  const json = JSON.stringify(payload);
  if (typeof window !== 'undefined' && typeof btoa === 'function') {
    return `data:application/json;base64,${btoa(unescape(encodeURIComponent(json)))}`;
  }
  return `data:application/json,${encodeURIComponent(json)}`;
}

/** Redeem a server-issued signed voucher. No unsigned/public claim path is used here. */
export async function mintClaimOnEthereum({ claimVoucher, claimSignature }) {
  if (!hasNftContract()) {
    throw new Error(`NFT contract not configured. Set NEXT_PUBLIC_VOXEL_NFT_ADDRESS and connect to ${EVM_CHAIN_NAME}.`);
  }
  if (!claimVoucher || !claimSignature) {
    throw new Error('A server-signed claim voucher is required before minting.');
  }

  const result = await redeemClaimVoucher(claimVoucher, claimSignature);
  return {
    ...result,
    ownershipGranted: result.status === 'confirmed',
    message:
      result.status === 'confirmed'
        ? `Claim confirmed on ${EVM_CHAIN_NAME}. Token ${result.tokenId || 'pending'} is owned by your wallet.`
        : `Claim submitted on ${EVM_CHAIN_NAME}. Wait for confirmation.`,
  };
}
