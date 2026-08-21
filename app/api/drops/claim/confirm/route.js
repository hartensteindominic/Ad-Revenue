import { NextResponse } from 'next/server';
import { assertClaimTransactionVerified } from '../../../../../lib/chainConfirmation';
import { confirmAuthoritativeClaim } from '../../../../../lib/authoritativeClaim';

export async function POST(request) {
  try {
    const body = await request.json();
    const verified = await assertClaimTransactionVerified({
      transactionHash: body.transactionHash,
      walletAddress: body.walletAddress,
      claimTicket: body.claimTicket,
    });
    const result = await confirmAuthoritativeClaim({
      dropId: body.dropId,
      walletAddress: body.walletAddress,
      claimTicket: body.claimTicket,
      transactionHash: body.transactionHash,
      tokenId: verified.tokenId,
    });
    return NextResponse.json({ ...result, ownershipGranted: true, verifiedChain: verified });
  } catch (error) {
    const status = error?.pending ? 202 : 400;
    return NextResponse.json({ error: error?.message || 'Claim confirmation failed', ownershipGranted: false }, { status });
  }
}
