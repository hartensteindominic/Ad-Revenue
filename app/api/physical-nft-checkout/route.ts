import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe-server';
import { getCatalogItem } from '../../../lib/catalog';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

const NFT_FEE_CENTS = 299;
const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { catalogId, wallet } = await request.json();
    const id = Number(catalogId);
    const normalizedWallet = String(wallet || '').toLowerCase();
    if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
    if (!WALLET_RE.test(normalizedWallet)) return NextResponse.json({ error: 'Connect a valid wallet first' }, { status: 400 });

    const item = getCatalogItem(id - 1);
    if (!item) return NextResponse.json({ error: 'Product unavailable' }, { status: 404 });
    if (!item.sourceUrl || !item.sourceName) return NextResponse.json({ error: 'This product has no verified online source' }, { status: 409 });

    // Fail closed: Voxel Vault must never accept a "ships to you" order unless
    // a real fulfillment provider is configured server-side.
    if (!process.env.FULFILLMENT_API_URL || !process.env.FULFILLMENT_API_KEY) {
      return NextResponse.json({
        error: 'Automatic physical fulfillment is not connected yet. The verified retailer remains available for the physical purchase, while NFT checkout can be completed separately.',
        code: 'FULFILLMENT_NOT_CONFIGURED',
        sourceUrl: item.sourceUrl,
      }, { status: 503 });
    }

    const physicalCents = Math.round(Number(item.priceUsd) * 100);
    if (!Number.isFinite(physicalCents) || physicalCents < 50) return NextResponse.json({ error: 'Product price is not configured for checkout' }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxelvault.io';
    const metadata = {
      mint_mode: 'physical_nft',
      catalog_id: String(id),
      catalog_key: item.id,
      wallet: normalizedWallet,
      buyer_id: user.id,
      physical_amount_cents: String(physicalCents),
      nft_amount_cents: String(NFT_FEE_CENTS),
      product_source_url: item.sourceUrl,
    };

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email || undefined,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US'] },
      phone_number_collection: { enabled: true },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: physicalCents,
          product_data: {
            name: item.name,
            description: `Verified real-world product from ${item.sourceName}.`,
          },
        },
      }, {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: NFT_FEE_CENTS,
          product_data: {
            name: `${item.name} · Voxel Vault Digital Twin`,
            description: 'One digital collectible for your Vault, Room, and world placement.',
          },
        },
      }],
      metadata,
      payment_intent_data: { metadata },
      success_url: `${appUrl}/mint?catalog=${id}&session_id={CHECKOUT_SESSION_ID}&physical=1`,
      cancel_url: `${appUrl}/mint?catalog=${id}&cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('physical + NFT checkout failed', error);
    return NextResponse.json({ error: 'Unable to start physical + NFT checkout' }, { status: 500 });
  }
}
