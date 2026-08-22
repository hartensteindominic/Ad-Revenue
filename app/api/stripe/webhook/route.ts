import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '../../../../lib/stripe-server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
import { getCatalogItem } from '../../../../lib/catalog';

const WALLET_RE = /^0x[a-f0-9]{40}$/;

async function submitPhysicalFulfillment(orderId: string, session: Stripe.Checkout.Session, catalogId: number, catalogKey: string) {
  const endpoint = process.env.FULFILLMENT_API_URL;
  const apiKey = process.env.FULFILLMENT_API_KEY;
  if (!endpoint || !apiKey) return { status: 'awaiting_fulfillment' as const };
  const shipping = session.shipping_details;
  if (!shipping?.address?.line1 || !shipping.address.city || !shipping.address.postal_code || !shipping.address.country) {
    throw new Error('Stripe checkout did not provide a complete shipping address');
  }
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ orderId, externalOrderId: session.id, catalogId, catalogKey, quantity: 1, shipping: {
      name: shipping.name || '', line1: shipping.address.line1, line2: shipping.address.line2 || null,
      city: shipping.address.city, state: shipping.address.state || '', postalCode: shipping.address.postal_code,
      country: shipping.address.country,
    } }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Fulfillment provider returned ${response.status}`);
  const result = await response.json().catch(() => ({}));
  return { status: 'submitted' as const,
    fulfillmentOrderId: typeof result.orderId === 'string' ? result.orderId : null,
    trackingNumber: typeof result.trackingNumber === 'string' ? result.trackingNumber : null,
    trackingUrl: typeof result.trackingUrl === 'string' ? result.trackingUrl : null };
}

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
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid') return NextResponse.json({ received: true });

      if (session.metadata?.mint_mode === 'physical_nft') {
        const wallet = session.metadata?.wallet?.toLowerCase();
        const buyerId = session.metadata?.buyer_id || null;
        const catalogId = Number(session.metadata?.catalog_id);
        const catalogKey = session.metadata?.catalog_key;
        const item = Number.isInteger(catalogId) ? getCatalogItem(catalogId - 1) : null;
        const shipping = session.shipping_details?.address;
        if (!WALLET_RE.test(wallet || '') || !item || !catalogKey || !buyerId) throw new Error('Invalid physical + NFT checkout metadata');
        if (!session.shipping_details?.name || !shipping?.line1 || !shipping.city || !shipping.state || !shipping.postal_code || !shipping.country) throw new Error('Incomplete shipping address');

        const { data: order, error } = await supabaseAdmin.from('physical_orders').upsert({
          buyer_id: buyerId, catalog_id: catalogId, catalog_key: catalogKey,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          shipping_name: session.shipping_details.name, shipping_line1: shipping.line1, shipping_line2: shipping.line2 || null,
          shipping_city: shipping.city, shipping_state: shipping.state || '', shipping_postal_code: shipping.postal_code,
          shipping_country: shipping.country, currency: session.currency || 'usd',
          physical_amount_cents: Number(session.metadata?.physical_amount_cents || 0), nft_amount_cents: Number(session.metadata?.nft_amount_cents || 0),
          fulfillment_status: 'awaiting_fulfillment',
        }, { onConflict: 'stripe_checkout_session_id' }).select('id').single();
        if (error || !order) throw error ?? new Error('Physical order creation failed');

        const fulfillment = await submitPhysicalFulfillment(order.id, session, catalogId, catalogKey);
        const update: Record<string, unknown> = { fulfillment_status: fulfillment.status, updated_at: new Date().toISOString() };
        if ('fulfillmentOrderId' in fulfillment) update.fulfillment_order_id = fulfillment.fulfillmentOrderId;
        if ('trackingNumber' in fulfillment) update.tracking_number = fulfillment.trackingNumber;
        if ('trackingUrl' in fulfillment) update.tracking_url = fulfillment.trackingUrl;
        await supabaseAdmin.from('physical_orders').update(update).eq('id', order.id);
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
    console.error('VoxelVault webhook fulfillment failed', error);
    return NextResponse.json({ error: 'Fulfillment failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
