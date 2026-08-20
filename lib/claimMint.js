/**
 * Claim metadata and signed-voucher redemption helpers.
 * Ownership is only granted after the NFT contract confirms the voucher redemption.
 */

import { getWallet, redeemClaimVoucher, hasNftContract, EVM_CHAIN_NAME } from './blockchain';

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

/**
 * Redeem a server-issued signed voucher. Legacy callers may provide a ticket/dropId;
 * this helper obtains the voucher from the server first. There is no unsigned fallback.
 */
export async function mintClaimOnEthereum({ claimVoucher, claimSignature, claimTicket, dropId, collectible }) {
  if (!hasNftContract()) {
    throw new Error(`NFT contract not configured. Set NEXT_PUBLIC_VOXEL_NFT_ADDRESS and connect to ${EVM_CHAIN_NAME}.`);
  }

  let voucher = claimVoucher;
  let signature = claimSignature;

  if (!voucher || !signature) {
    if (!claimTicket || !dropId) throw new Error('A server-signed claim voucher is required before minting.');
    const { address } = await getWallet();
    const response = await fetch('/api/drops/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dropId, walletAddress: address, requireInZone: false }),
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 409) throw new Error(data.error || 'Could not obtain a signed claim voucher.');
    voucher = data.claimVoucher;
    signature = data.claimSignature;
    if (!voucher || !signature) throw new Error(data.message || 'Claim signer is not configured for on-chain redemption.');
  }

  if (collectible && voucher.uri == null) {
    voucher = { ...voucher, uri: buildClaimMetadataUri({ collectible, claimTicket, dropId }) };
  }

  const result = await redeemClaimVoucher(voucher, signature);
  return {
    ...result,
    ownershipGranted: result.status === 'confirmed',
    message:
      result.status === 'confirmed'
        ? `Claim confirmed on ${EVM_CHAIN_NAME}. Token ${result.tokenId || 'pending'} is owned by your wallet.`
        : `Claim submitted on ${EVM_CHAIN_NAME}. Wait for confirmation.`,
  };
}
