import Stripe from 'stripe';
import { rewardEventKey } from './verifiedEvent.js';

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(secret, { apiVersion: '2025-07-30.basil' });
}

export function verifyStripeWebhook(payload, signature) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}

export function buildVerifiedRewardRecord(event) {
  if (!event?.id || event.type !== 'checkout.session.completed') return null;
  const session = event.data?.object;
  if (session?.payment_status !== 'paid') return null;
  const campaignId = session.metadata?.campaignId;
  const collector = session.metadata?.collector;
  if (!campaignId || !collector) return null;
  const amountCents = Number(session.amount_total);
  if (!Number.isInteger(amountCents) || amountCents < 0) return null;
  return { id: rewardEventKey({ paymentId: event.id, campaignId, collector }), paymentId: event.id, campaignId, collector, amountCents, currency: session.currency || 'usd', status: 'verified' };
}
