import { verifyTypedData, isAddress } from 'ethers';

export const PROXIMITY_DOMAIN = Object.freeze({
  name: 'VoxelVault-Proximity-V1',
  version: '1',
  chainId: 11155111,
});

export const PROXIMITY_TYPES = Object.freeze({
  Proximity: [
    { name: 'dropId', type: 'string' },
    { name: 'wallet', type: 'address' },
    { name: 'expiresAt', type: 'uint256' },
    { name: 'spatialCell', type: 'bytes32' },
    { name: 'scoreBps', type: 'uint16' },
  ],
});

export function verifyProximityProof(proof, expectedWallet, expectedDropId, now = Math.floor(Date.now() / 1000)) {
  if (!proof || typeof proof !== 'object') return { valid: false, reason: 'missing_proximity_proof' };
  if (!isAddress(expectedWallet)) return { valid: false, reason: 'invalid_wallet' };
  if (proof.dropId !== expectedDropId) return { valid: false, reason: 'drop_mismatch' };
  if (String(proof.wallet).toLowerCase() !== expectedWallet.toLowerCase()) return { valid: false, reason: 'wallet_mismatch' };
  if (!proof.signature || !proof.spatialCell) return { valid: false, reason: 'incomplete_proximity_proof' };
  if (Number(proof.expiresAt) <= now) return { valid: false, reason: 'proximity_proof_expired' };

  const domain = {
    ...PROXIMITY_DOMAIN,
    verifyingContract: process.env.NEXT_PUBLIC_BOUNTY_ESCROW_ADDRESS || '0x0000000000000000000000000000000000000001',
  };
  const value = {
    dropId: proof.dropId,
    wallet: proof.wallet,
    expiresAt: BigInt(proof.expiresAt),
    spatialCell: proof.spatialCell,
    scoreBps: Number(proof.scoreBps || 0),
  };

  try {
    const signer = verifyTypedData(domain, PROXIMITY_TYPES, value, proof.signature);
    const expectedSigner = process.env.PROXIMITY_ORACLE_SIGNER;
    if (!expectedSigner || !isAddress(expectedSigner)) {
      return { valid: false, reason: 'proximity_oracle_not_configured' };
    }
    if (signer.toLowerCase() !== expectedSigner.toLowerCase()) {
      return { valid: false, reason: 'untrusted_proximity_oracle' };
    }
    return { valid: true, signer, spatialCell: proof.spatialCell, scoreBps: Number(proof.scoreBps || 0), expiresAt: Number(proof.expiresAt) };
  } catch {
    return { valid: false, reason: 'invalid_proximity_signature' };
  }
}
