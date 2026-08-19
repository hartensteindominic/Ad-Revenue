import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe-server';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      // Persist the paid order and entitlement with the server-side Supabase client.
      // This handler intentionally does not trust the browser success URL.
      console.info('VoxelVault checkout completed', session.id, session.metadata?.asset_id);
      break;
    }
    case 'checkout.session.async_payment_succeeded': {
      console.info('VoxelVault async payment succeeded');
      break;
    }
    case 'charge.refunded': {
      console.info('VoxelVault charge refunded');
      break;
    }
    case 'account.updated': {
      console.info('VoxelVault seller account updated');
      break;
    }
  }

  return NextResponse.json({ received: true });
}
