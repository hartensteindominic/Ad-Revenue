import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (stripeClient) return stripeClient;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not configured');
  stripeClient = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
  return stripeClient;
}

export const PLATFORM_FEE_BPS = 2000;
export function platformFee(amountCents: number) { return Math.floor(amountCents * PLATFORM_FEE_BPS / 10000); }
