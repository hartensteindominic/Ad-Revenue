import { Wallet, keccak256, toUtf8Bytes } from 'ethers';

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
  return keccak256(toUtf8Bytes(String(value || '')));
}

export function getClaimVoucherConfig() {
  const privateKey = process.env.CLAIM_SIGNER_PRIVATE_KEY || '';
  const contract = process.env.NEXT_PUBLIC_VOXEL_NFT_ADDRESS || '';
  const chainIdRaw = process.env.CLAIM_CHAIN_ID || process.env.NEXT_PUBLIC_EVM_CHAIN_ID || '11155111';
  const chainId = chainIdRaw.startsWith('0x') ? BigInt(chainIdRaw) : BigInt(chainIdRaw);
  const royaltyReceiver = process.env.CLAIM_ROYALTY_RECEIVER || '';
  return { privateKey, contract, chainId, royaltyReceiver };
}

export async function issueClaimVoucher({ recipient, dropId, claimTicket, uri, royaltyBps = 500, deadline, nonce }) {
  const { privateKey, contract, chainId, royaltyReceiver } = getClaimVoucherConfig();
  if (!privateKey) throw new Error('Claim signer is not configured.');
  if (!contract) throw new Error('NFT contract is not configured.');
  if (!royaltyReceiver) throw new Error('Claim royalty receiver is not configured.');
  if (!recipient || !/^0x[a-fA-F0-9]{40}$/.test(recipient)) throw new Error('Claim recipient is invalid.');
  if (!Number.isInteger(Number(deadline)) || Number(deadline) <= Math.floor(Date.now() / 1000)) throw new Error('Claim deadline is invalid.');

  const wallet = new Wallet(privateKey);
  const voucher = {
    recipient,
    royaltyReceiver,
    dropId: hashClaimValue(dropId),
    claimTicketHash: hashClaimValue(claimTicket),
    uriHash: hashClaimValue(uri),
    royaltyBps: Number(royaltyBps),
    nonce: BigInt(nonce || Date.now()),
    deadline: BigInt(deadline),
  };

  const domain = {
    name: 'Voxel Vault Claims',
    version: '1',
    chainId,
    verifyingContract: contract,
  };

  const signature = await wallet.signTypedData(domain, CLAIM_VOUCHER_TYPES, voucher);

  return {
    voucher: {
      ...voucher,
      nonce: voucher.nonce.toString(),
      deadline: voucher.deadline.toString(),
    },
    signature,
    signer: wallet.address,
    domain,
  };
}
