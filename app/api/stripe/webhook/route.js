import { NextResponse } from 'next/server';
import { buildVerifiedRewardRecord, verifyStripeWebhook } from '../../../../lib/rewards/stripeWebhook.js';
import { persistRewardEvent, recordStripeEvent } from '../../../../lib/rewards/persistence.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });

  try {
    const rawBody = await request.text();
    const event = verifyStripeWebhook(rawBody, signature);
    const recorded = await recordStripeEvent(event);
    if (recorded.duplicate) return NextResponse.json({ received: true, eventId: event.id, duplicate: true });

    const reward = buildVerifiedRewardRecord(event);
    let persistedReward = null;
    if (reward) persistedReward = await persistRewardEvent(reward);

    return NextResponse.json({
      received: true,
      eventId: event.id,
      verified: true,
      reward: persistedReward ? { id: persistedReward.id, status: persistedReward.status, claimable: false } : null,
    });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error?.message || error);
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  }
}
