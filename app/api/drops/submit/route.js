import { NextResponse } from 'next/server';
import { markClaimSubmitted } from '../../../../lib/claimAuthority.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await markClaimSubmitted({
      dropId: body.dropId,
      walletAddress: body.walletAddress,
      claimTicket: body.claimTicket,
      transactionHash: body.transactionHash,
    });
    return NextResponse.json({ ...result, ownershipGranted: false, status: 'submitted' });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Claim submission failed', ownershipGranted: false }, { status: 400 });
  }
}
