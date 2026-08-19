// @ts-nocheck
import { NextResponse } from 'next/server';
import { stripe, platformFee } from '@/lib/stripe-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const assetId = String(body.assetId || '');
    const title = String(body.title || 'VoxelVault asset');
    const priceCents = Number(body.priceCents);
    const currency = String(body.currency || 'usd');
    const sellerStripeAccountId = body.sellerStripeAccountId ? String(body.sellerStripeAccountId) : '';

    if (!assetId || !Number.isInteger(priceCents) || priceCents < 50) {
      return NextResponse.json({ error: 'Invalid asset or price' }, { status: 400 });
    }

    const fee = platformFee(priceCents);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency,
          unit_amount: priceCents,
          product_data: { name: title },
        },
      }],
      metadata: { asset_id: assetId },
      payment_intent_data: {
        metadata: { asset_id: assetId },
        ...(sellerStripeAccountId ? {
          application_fee_amount: fee,
          transfer_data: { destination: sellerStripeAccountId },
        } : {}),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/purchases?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/assets/${encodeURIComponent(assetId)}?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('checkout creation failed', error);
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}
