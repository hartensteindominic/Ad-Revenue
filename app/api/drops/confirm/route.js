import { NextResponse } from 'next/server';
import { markClaimConfirmed } from '../../../../lib/claimAuthority.js';
import { verifyClaimTransaction } from '../../../../lib/claimChainVerifier.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const verification = await verifyClaimTransaction({
      transactionHash: body.transactionHash,
      walletAddress: body.walletAddress,
      claimTicket: body.claimTicket,
    });

    const result = await markClaimConfirmed({
      dropId: body.dropId,
      walletAddress: body.walletAddress,
      claimTicket: body.claimTicket,
      tokenId: verification.tokenId,
    });

    return NextResponse.json({
      ...result,
      verification,
      ownershipGranted: true,
      status: 'confirmed',
    });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Authoritative claim confirmation failed', ownershipGranted: false }, { status: 400 });
  }
}
