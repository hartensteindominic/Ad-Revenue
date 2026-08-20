import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) throw new Error('STRIPE_SECRET_KEY is not configured');

export const stripe = new Stripe(secret, { apiVersion: '2025-08-27.basil' });
export const PLATFORM_FEE_BPS = 2000;
export function platformFee(amountCents: number) { return Math.floor(amountCents * PLATFORM_FEE_BPS / 10000); }
