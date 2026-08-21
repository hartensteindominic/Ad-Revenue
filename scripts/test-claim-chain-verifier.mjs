import assert from 'node:assert/strict';
import { verifyClaimTransaction } from '../lib/claimChainVerifier.js';

await assert.rejects(
  verifyClaimTransaction({ transactionHash: 'not-a-hash', walletAddress: '0x0000000000000000000000000000000000000001', claimTicket: 'ticket' }),
  /Invalid transaction hash/
);

await assert.rejects(
  verifyClaimTransaction({ transactionHash: `0x${'1'.repeat(64)}`, walletAddress: 'not-an-address', claimTicket: 'ticket' }),
  /Invalid claimant wallet/
);

await assert.rejects(
  verifyClaimTransaction({ transactionHash: `0x${'1'.repeat(64)}`, walletAddress: '0x0000000000000000000000000000000000000001', claimTicket: '' }),
  /Claim ticket is required/
);

console.log('Claim chain verifier input hardening tests passed.');
