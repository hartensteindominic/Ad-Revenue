import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const amountCents = Number(body?.amountCents);
    const split = body?.split || {};
    if (!Number.isInteger(amountCents) || amountCents < 0) return NextResponse.json({ error: 'amountCents must be a non-negative integer' }, { status: 400 });
    const weights = Object.values(split).reduce((sum, value) => sum + Number(value), 0);
    if (!Number.isFinite(weights) || weights <= 0) return NextResponse.json({ error: 'A valid reward split is required' }, { status: 400 });
    const allocations = Object.fromEntries(Object.entries(split).map(([key, value]) => [key, Math.floor(amountCents * Number(value) / weights)]));
    return NextResponse.json({ status: 'preview', verified: false, claimable: false, amountCents, allocations, notice: 'Preview only. Rewards become claimable only after verified payment reconciliation.' });
  } catch {
    return NextResponse.json({ error: 'Invalid reward preview request' }, { status: 400 });
  }
}
