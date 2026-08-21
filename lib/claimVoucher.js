import { Wallet, getAddress, keccak256, toUtf8Bytes } from 'ethers';

export const CLAIM_VOUCHER_TYPES = {
  ClaimVoucher: [
    { name: 'recipient', type: 'address' },
    { name: 'royaltyReceiver', type: 'address' },
    { name: 'dropId', type: 'bytes32' },
    { name: 'claimTicketHash', type: 'bytes32' },
    { name: 'uriHash', type: 'bytes32' },
    { name: 'royaltyBps', type: 'uint96' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
};

export function hashClaimValue(value) {
  return keccak256(toUtf8Bytes(String(value ?? '')));
}

function normalizeAddress(value, label) {
  try {
    return getAddress(value);
  } catch {
    throw new Error(`${label} is invalid.`);
  }
}

export function getClaimVoucherConfig() {
  const privateKey = process.env.CLAIM_SIGNER_PRIVATE_KEY || '';
  const contract = process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS || '';
  const chainIdRaw = process.env.CLAIM_CHAIN_ID || process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '11155111';
  const royaltyReceiver = process.env.CLAIM_ROYALTY_RECEIVER || '';

  let chainId;
  try {
    chainId = chainIdRaw.startsWith('0x') ? BigInt(chainIdRaw) : BigInt(chainIdRaw);
  } catch {
    throw new Error('Claim chain ID is invalid.');
  }

  return { privateKey, contract, chainId, royaltyReceiver };
}

/**
 * Validate only configuration that can be checked without contacting the chain.
 * Production claim issuance should fail closed on malformed addresses, keys,
 * chain IDs, and impossible royalty values rather than producing a voucher that
 * is guaranteed to fail later on-chain.
 */
export function validateClaimVoucherConfig() {
  const { privateKey, contract, chainId, royaltyReceiver } = getClaimVoucherConfig();
  if (!privateKey) throw new Error('Claim signer is not configured.');
  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) throw new Error('Claim signer key is invalid.');
  if (!contract) throw new Error('NFT contract is not configured.');
  if (!royaltyReceiver) throw new Error('Claim royalty receiver is not configured.');

  const normalizedContract = normalizeAddress(contract, 'NFT contract');
  const normalizedRoyaltyReceiver = normalizeAddress(royaltyReceiver, 'Claim royalty receiver');
  if (chainId <= 0n) throw new Error('Claim chain ID must be positive.');

  const signer = new Wallet(privateKey);
  return {
    signer: signer.address,
    contract: normalizedContract,
    royaltyReceiver: normalizedRoyaltyReceiver,
    chainId,
  };
}

export async function issueClaimVoucher({ recipient, dropId, claimTicket, uri, royaltyBps = 500, deadline, nonce }) {
  const { privateKey, contract, chainId, royaltyReceiver } = getClaimVoucherConfig();
  if (!privateKey) throw new Error('Claim signer is not configured.');
  if (!contract) throw new Error('NFT contract is not configured.');
  if (!royaltyReceiver) throw new Error('Claim royalty receiver is not configured.');

  const normalizedRecipient = normalizeAddress(recipient, 'Claim recipient');
  const normalizedContract = normalizeAddress(contract, 'NFT contract');
  const normalizedRoyaltyReceiver = normalizeAddress(royaltyReceiver, 'Claim royalty receiver');
  const numericRoyalty = Number(royaltyBps);

  if (!Number.isInteger(numericRoyalty) || numericRoyalty < 0 || numericRoyalty > 1500) {
    throw new Error('Claim royalty is invalid.');
  }
  if (!dropId || !claimTicket || !uri) throw new Error('Claim voucher values are incomplete.');
  if (!Number.isInteger(Number(deadline)) || Number(deadline) <= Math.floor(Date.now() / 1000)) {
    throw new Error('Claim deadline is invalid.');
  }

  const wallet = new Wallet(privateKey);
  const voucherNonce = BigInt(nonce || 0);
  if (voucherNonce <= 0n) throw new Error('Claim nonce is invalid.');

  const voucher = {
    recipient: normalizedRecipient,
    royaltyReceiver: normalizedRoyaltyReceiver,
    dropId: hashClaimValue(dropId),
    claimTicketHash: hashClaimValue(claimTicket),
    uriHash: hashClaimValue(uri),
    royaltyBps: numericRoyalty,
    nonce: voucherNonce,
    deadline: BigInt(deadline),
  };

  const domain = {
    name: 'Voxel Vault Claims',
    version: '1',
    chainId,
    verifyingContract: normalizedContract,
  };

  const signature = await wallet.signTypedData(domain, CLAIM_VOUCHER_TYPES, voucher);

  return {
    voucher: {
      ...voucher,
      uri,
      nonce: voucher.nonce.toString(),
      deadline: voucher.deadline.toString(),
    },
    signature,
    signer: wallet.address,
    domain,
  };
}
