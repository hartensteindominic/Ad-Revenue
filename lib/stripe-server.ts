import Stripe from 'stripe';

export const PLATFORM_FEE_BPS = 2000;

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not configured');
  return new Stripe(secret, { apiVersion: '2025-08-27.basil' });
}

export function platformFee(amountCents: number) {
  return Math.floor(amountCents * PLATFORM_FEE_BPS / 10000);
}
