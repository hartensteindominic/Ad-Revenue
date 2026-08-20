import { NextResponse } from 'next/server';
import { calculateDropPoolAllocation } from '../../../../lib/dropEconomy';

export async function POST(request) {
  try {
    const body = await request.json();
    const platformFeeWei = BigInt(body.platformFeeWei ?? '0');
    const dropPoolBps = Number(body.dropPoolBps ?? 1000);
    if (!Number.isInteger(dropPoolBps) || dropPoolBps < 0 || dropPoolBps > 5000) {
      return NextResponse.json({ error: 'Invalid Drop Pool allocation.' }, { status: 400 });
    }
    const allocationWei = calculateDropPoolAllocation(platformFeeWei, dropPoolBps);
    return NextResponse.json({ allocationWei: allocationWei.toString(), status: 'calculated' });
  } catch (error) {
    return NextResponse.json({ error: error?.message || 'Invalid Drop Pool request.' }, { status: 400 });
  }
}
