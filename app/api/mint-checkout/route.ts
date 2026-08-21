import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe-server';
import { getCatalogItem } from '../../../lib/catalog';

export async function POST(request: Request) {
  try {
    const { catalogId, wallet } = await request.json();
    const id = Number(catalogId);
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid object' }, { status: 400 });
    if (!/^0x[a-fA-F0-9]{40}$/.test(String(wallet || ''))) return NextResponse.json({ error: 'Connect a valid wallet first' }, { status: 400 });

    const item = getCatalogItem(id - 1);
    const amount = Math.max(1, Math.round(Number(item.priceUsd) * 100));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxel-vault.vercel.app';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: {
        currency: 'usd',
        unit_amount: amount,
        product_data: { name: `${item.name} · Voxel Vault NFT`, description: `Digital twin of a ${item.realityBasis}. Physical fulfillment may be available separately.` },
      } }],
      metadata: { mint_mode: 'usd', catalog_id: String(id), wallet: String(wallet).toLowerCase() },
      payment_intent_data: { metadata: { mint_mode: 'usd', catalog_id: String(id), wallet: String(wallet).toLowerCase() } },
      success_url: `${appUrl}/mint?catalog=${id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/mint?catalog=${id}&cancelled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('USD mint checkout failed', error);
    return NextResponse.json({ error: 'Unable to start USD checkout' }, { status: 500 });
  }
}
