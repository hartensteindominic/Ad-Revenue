import Stripe from 'stripe';

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_SECRET_KEY is not configured');
  client = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
  return client;
}

// Lazy proxy keeps route modules buildable when Stripe is intentionally not
// configured in CI/preview environments. The secret is required only when a
// request actually attempts to use Stripe.
export const stripe = new Proxy({}, {
  get(_target, property) {
    return (getStripe() as any)[property];
  },
}) as unknown as Stripe;

export const PLATFORM_FEE_BPS = 2000;
export function platformFee(amountCents: number) {
  return Math.floor(amountCents * PLATFORM_FEE_BPS / 10000);
}
