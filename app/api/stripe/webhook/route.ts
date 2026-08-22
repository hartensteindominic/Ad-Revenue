import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '../../../../lib/stripe-server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
import { getCatalogItem } from '../../../../lib/catalog';
import { submitPhysicalFulfillment } from '../../../../lib/fulfillment';

const WALLET_RE = /^0x[a-f0-9]{40}$/;
type ShippingDetails = {
  name?: string | null;
  phone?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
};
type CheckoutSessionWithShipping = Stripe.Checkout.Session & { shipping_details?: ShippingDetails | null };

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 400 });
  const payload = await request.text();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(payload, signature, secret); }
  catch { return NextResponse.json({ error: 'Invalid signature' }, { status: 400 }); }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as CheckoutSessionWithShipping;
      if (session.payment_status !== 'paid') return NextResponse.json({ received: true });

      if (session.metadata?.mint_mode === 'physical_nft') {
        const wallet = session.metadata?.wallet?.toLowerCase();
        const buyerId = session.metadata?.buyer_id || null;
        const catalogId = Number(session.metadata?.catalog_id);
        const catalogKey = session.metadata?.catalog_key;
        const item = Number.isInteger(catalogId) ? getCatalogItem(catalogId - 1) : null;
        const shipping = session.shipping_details;
        const address = shipping?.address;
        if (!WALLET_RE.test(wallet || '') || !item || !catalogKey || !buyerId) throw new Error('Invalid physical + NFT checkout metadata');
        if (!shipping?.name || !address?.line1 || !address.city || !address.state || !address.postal_code || !address.country) throw new Error('Incomplete shipping address');

        const { data: existing, error: lookupError } = await supabaseAdmin
          .from('physical_orders')
          .select('id,fulfillment_status,fulfillment_order_id,tracking_number,tracking_url')
          .eq('stripe_checkout_session_id', session.id)
          .maybeSingle();
        if (lookupError) throw lookupError;

        let order = existing;
        if (!order) {
          const { data: created, error } = await supabaseAdmin.from('physical_orders').insert({
            buyer_id: buyerId,
            catalog_id: catalogId,
            catalog_key: catalogKey,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            shipping_name: shipping.name,
            shipping_line1: address.line1,
            shipping_line2: address.line2 || null,
            shipping_city: address.city,
            shipping_state: address.state || '',
            shipping_postal_code: address.postal_code,
            shipping_country: address.country,
            currency: session.currency || 'usd',
            physical_amount_cents: Number(session.metadata?.physical_amount_cents || 0),
            nft_amount_cents: Number(session.metadata?.nft_amount_cents || 0),
            fulfillment_status: 'awaiting_fulfillment',
          }).select('id,fulfillment_status,fulfillment_order_id,tracking_number,tracking_url').single();
          if (error || !created) throw error ?? new Error('Physical order creation failed');
          order = created;
        }

        if (!['submitted', 'shipped', 'delivered'].includes(order.fulfillment_status)) {
          try {
            const fulfillment = await submitPhysicalFulfillment({
              orderId: order.id,
              externalOrderId: session.id,
              catalogKey,
              shipping,
              email: session.customer_details?.email || session.customer_email || undefined,
            });
            const update: Record<string, unknown> = { fulfillment_status: fulfillment.status, updated_at: new Date().toISOString() };
            if ('fulfillmentOrderId' in fulfillment && fulfillment.fulfillmentOrderId) update.fulfillment_order_id = fulfillment.fulfillmentOrderId;
            if ('trackingNumber' in fulfillment && fulfillment.trackingNumber) update.tracking_number = fulfillment.trackingNumber;
            if ('trackingUrl' in fulfillment && fulfillment.trackingUrl) update.tracking_url = fulfillment.trackingUrl;
            await supabaseAdmin.from('physical_orders').update(update).eq('id', order.id);
          } catch (fulfillmentError) {
            console.error('VoxelVault physical fulfillment submission failed', fulfillmentError);
            // Stripe retries the signed webhook. The provider adapter uses the
            // durable Voxel Vault order ID as its idempotency key where supported.
            return NextResponse.json({ error: 'Fulfillment submission failed; retrying' }, { status: 500 });
          }
        }
        return NextResponse.json({ received: true });
      }

      const assetId = session.metadata?.asset_id;
      const buyerId = session.metadata?.buyer_id;
      if (assetId && buyerId) {
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
    console.error('VoxelVault webhook failed', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
