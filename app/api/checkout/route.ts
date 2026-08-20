import { NextResponse } from 'next/server';
import { stripe, platformFee } from '../../../lib/stripe-server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 4 * 1024;

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'Request too large' }, { status: 413 });

    const supabaseAdmin = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || token.length > 4096) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const assetId = typeof body?.assetId === 'string' ? body.assetId.trim() : '';
    if (!assetId || assetId.length > 128) return NextResponse.json({ error: 'Valid assetId is required' }, { status: 400 });

    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('id,title,price_cents,currency,seller_id,status')
      .eq('id', assetId)
      .eq('status', 'published')
      .single();

    if (assetError || !asset) return NextResponse.json({ error: 'Asset unavailable' }, { status: 404 });
    if (!Number.isInteger(asset.price_cents) || asset.price_cents <= 0 || asset.price_cents > 10_000_000) {
      return NextResponse.json({ error: 'Asset price is invalid' }, { status: 409 });
    }
    if (!/^[a-zA-Z]{3}$/.test(asset.currency || '')) return NextResponse.json({ error: 'Asset currency is invalid' }, { status: 409 });
    if (asset.seller_id === user.id) return NextResponse.json({ error: 'You cannot purchase your own asset' }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from('download_entitlements')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('asset_id', asset.id)
      .maybeSingle();
    if (existing) return NextResponse.json({ error: 'Already purchased' }, { status: 409 });

    const { data: seller } = await supabaseAdmin
      .from('seller_accounts')
      .select('stripe_account_id,charges_enabled,payouts_enabled')
      .eq('user_id', asset.seller_id)
      .maybeSingle();

    const fee = platformFee(asset.price_cents);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxel-vault.vercel.app';
    let successOrigin;
    try {
      const parsed = new URL(appUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('bad protocol');
      successOrigin = parsed.origin;
    } catch {
      return NextResponse.json({ error: 'Application URL is misconfigured' }, { status: 500 });
    }

    const idempotencyKeyHeader = request.headers.get('idempotency-key')?.trim();
    const idempotencyKey = idempotencyKeyHeader && /^[A-Za-z0-9._:-]{8,255}$/.test(idempotencyKeyHeader)
      ? `checkout:${user.id}:${idempotencyKeyHeader}`
      : `checkout:${user.id}:${asset.id}:${Date.now()}`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email || undefined,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: asset.currency.toLowerCase(),
          unit_amount: asset.price_cents,
          product_data: { name: String(asset.title || 'Voxel Vault asset').slice(0, 500) },
        },
      }],
      metadata: { asset_id: asset.id, buyer_id: user.id },
      payment_intent_data: {
        metadata: { asset_id: asset.id, buyer_id: user.id },
        ...(seller?.stripe_account_id && seller.charges_enabled && seller.payouts_enabled
          ? { application_fee_amount: fee, transfer_data: { destination: seller.stripe_account_id } }
          : {}),
      },
      success_url: `${successOrigin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successOrigin}/?checkout=cancelled`,
    }, { idempotencyKey });

    return NextResponse.json(
      { url: session.url },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    console.error('checkout creation failed', error);
    return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
  }
}
