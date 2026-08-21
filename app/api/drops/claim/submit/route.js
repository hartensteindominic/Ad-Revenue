import { NextResponse } from 'next/server';
import { submitAuthoritativeClaim } from '../../../../../lib/authoritativeClaim';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await submitAuthoritativeClaim({
      dropId: body.dropId,
      walletAddress: body.walletAddress,
      claimTicket: body.claimTicket,
      transactionHash: body.transactionHash,
    });
    return NextResponse.json({ ...result, ownershipGranted: false, nextStep: 'server verifies chain receipt' });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Claim submission failed', ownershipGranted: false }, { status: 400 });
  }
}
