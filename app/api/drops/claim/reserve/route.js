import { NextResponse } from 'next/server';
import { reserveAuthoritativeClaim } from '../../../../../lib/authoritativeClaim';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await reserveAuthoritativeClaim({
      dropId: body.dropId,
      walletAddress: body.walletAddress,
      proximityProof: body.proximityProof,
      distanceMeters: body.distanceMeters,
      ttlSeconds: body.ttlSeconds,
    });
    if (!result.authorized) return NextResponse.json({ ...result, ownershipGranted: false }, { status: result.reason === 'already_claimed' ? 409 : 403 });
    return NextResponse.json({ ...result, ownershipGranted: false, cameraRequired: false, nextStep: 'COLLECT -> submit transaction -> confirm' });
  } catch (error) {
    const message = error?.message || 'Claim reservation failed';
    const status = message.includes('Proximity proof') ? 403 : message.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: message, ownershipGranted: false }, { status });
  }
}
