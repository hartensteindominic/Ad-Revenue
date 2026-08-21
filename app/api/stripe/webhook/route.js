import { NextResponse } from 'next/server';
import { buildVerifiedRewardRecord, verifyStripeWebhook } from '../../../../lib/rewards/stripeWebhook.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  try {
    const rawBody = await request.text();
    const event = verifyStripeWebhook(rawBody, signature);
    const reward = buildVerifiedRewardRecord(event);
    return NextResponse.json({ received: true, eventId: event.id, verified: true, reward: reward ? { ...reward, claimable: false } : null });
  } catch (error) {
    console.error('Stripe webhook verification failed:', error?.message || error);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  }
}
