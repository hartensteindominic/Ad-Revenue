import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '../../../lib/stripe-server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  const payload = await request.text();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(payload, signature, secret); }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }); }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;
      const assetId = session.metadata?.asset_id;
      const buyerId = session.metadata?.buyer_id;
      if (assetId && buyerId && session.payment_status === 'paid') {
        const { data: asset, error: assetError } = await supabaseAdmin.from('assets').select('id,seller_id,price_cents,currency').eq('id', assetId).eq('status', 'published').single();
        if (assetError || !asset) throw assetError ?? new Error('Asset not found');
        const amount = session.amount_total ?? asset.price_cents;
        const { data: order, error: orderError } = await supabaseAdmin.from('orders').upsert({ buyer_id: buyerId, stripe_checkout_session_id: session.id, stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null, currency: session.currency ?? asset.currency, subtotal_cents: amount, platform_fee_cents: Math.floor(amount * 0.2), status: 'paid' }, { onConflict: 'stripe_checkout_session_id' }).select('id').single();
        if (orderError || !order) throw orderError ?? new Error('Order creation failed');
        const { error: itemError } = await supabaseAdmin.from('order_items').upsert({ order_id: order.id, asset_id: asset.id, seller_id: asset.seller_id, unit_amount_cents: amount }, { onConflict: 'order_id,asset_id' });
        if (itemError) throw itemError;
        const { error: entitlementError } = await supabaseAdmin.from('download_entitlements').upsert({ buyer_id: buyerId, asset_id: asset.id, order_id: order.id }, { onConflict: 'buyer_id,asset_id' });
        if (entitlementError) throw entitlementError;
      }
    }
  } catch (error) {
    console.error('VoxelVault webhook fulfillment failed', error);
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
