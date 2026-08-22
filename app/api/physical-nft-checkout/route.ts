import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe-server';
import { getCatalogItem } from '../../../lib/catalog';

const NFT_FEE_CENTS = 299;
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: Request) {
  try {
    const { catalogId, wallet } = await request.json();
    const id = Number(catalogId);
    const normalizedWallet = String(wallet || '').toLowerCase();
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    if (!WALLET_RE.test(normalizedWallet)) return NextResponse.json({ error: 'Connect a valid wallet first' }, { status: 400 });

    const item = getCatalogItem(id - 1);
    if (!item) return NextResponse.json({ error: 'Product unavailable' }, { status: 404 });
    if (!item.sourceUrl || !item.sourceName) return NextResponse.json({ error: 'This product has no verified online source' }, { status: 409 });

    // Physical fulfillment is deliberately fail-closed. A product cannot be presented as
    // "ships to you" until a real fulfillment adapter is configured and verified.
    if (!process.env.FULFILLMENT_API_URL || !process.env.FULFILLMENT_API_KEY) {
      return NextResponse.json({
        error: 'Physical fulfillment is not configured yet. Use the verified retailer link for the physical product; NFT checkout remains available separately.',
        code: 'FULFILLMENT_NOT_CONFIGURED',
        sourceUrl: item.sourceUrl,
      }, { status: 503 });
    }

    const physicalCents = Math.round(Number(item.priceUsd) * 100);
    if (!Number.isFinite(physicalCents) || physicalCents < 50) return NextResponse.json({ error: 'Product price is not configured for checkout' }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxelvault.io';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      shipping_address_collection: { allowed_countries: ['US'] },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: physicalCents + NFT_FEE_CENTS,
          product_data: {
            name: `${item.name} + Voxel Vault Digital Twin`,
            description: `Physical ${item.name} fulfillment plus one Voxel Vault digital collectible. Physical fulfillment is submitted only after verified payment.`,
          },
        },
      }],
      metadata: {
        mint_mode: 'physical_nft',
        catalog_id: String(id),
        catalog_key: item.id,
        wallet: normalizedWallet,
        physical_amount_cents: String(physicalCents),
        nft_amount_cents: String(NFT_FEE_CENTS),
        product_source_url: item.sourceUrl,
      },
      payment_intent_data: {
        metadata: {
          mint_mode: 'physical_nft',
          catalog_id: String(id),
          catalog_key: item.id,
          wallet: normalizedWallet,
        },
      },
      success_url: `${appUrl}/mint?catalog=${id}&session_id={CHECKOUT_SESSION_ID}&physical=1`,
      cancel_url: `${appUrl}/mint?catalog=${id}&cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('physical + NFT checkout failed', error);
    return NextResponse.json({ error: 'Unable to start physical + NFT checkout' }, { status: 500 });
  }
}
