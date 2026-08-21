import { NextResponse } from 'next/server';
import { authorizeClaim } from '../../../../lib/claimAuthority.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { missionId, dropId, walletAddress, distanceMeters, requireInZone = false } = body || {};
    if (!missionId || !dropId || !walletAddress) {
      return NextResponse.json({ ok: false, error: 'missionId, dropId, and walletAddress are required' }, { status: 400 });
    }
    const authorization = await authorizeClaim({ dropId, walletAddress, distanceMeters, requireInZone });
    if (!authorization.authorized) {
      return NextResponse.json({ ok: false, reason: authorization.reason, claimTicket: authorization.claimTicket || null }, { status: 409 });
    }
    return NextResponse.json({
      ok: true,
      missionId,
      stage: 'verified',
      proof: { id: authorization.claimTicket, verified: true, source: 'server-claim-authority' },
      next: 'eligibility_then_wallet-confirmed-claim',
      ownership: 'not granted until chain confirmation',
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error?.message || 'Verification failed' }, { status: 400 });
  }
}
