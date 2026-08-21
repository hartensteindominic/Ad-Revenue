import { NextResponse } from 'next/server';
import { getStripe, platformFee } from '../../../lib/stripe-server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

const MAX_ASSET_ID_LENGTH = 128;

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7).trim() : null;
    if (!token) return errorResponse('Authentication required', 401);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return errorResponse('Authentication required', 401);

    const body = await request.json().catch(() => null);
    const assetId = typeof body?.assetId === 'string' ? body.assetId.trim() : '';
    if (!assetId || assetId.length > MAX_ASSET_ID_LENGTH) return errorResponse('A valid assetId is required', 400);

    const idempotencyKey = request.headers.get('idempotency-key')?.trim();
    if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 255)) {
      return errorResponse('Invalid idempotency key', 400);
    }

    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('id,title,price_cents,currency,seller_id,status')
      .eq('id', assetId)
      .eq('status', 'published')
      .single();
    if (assetError || !asset) return errorResponse('Asset unavailable', 404);
    if (asset.seller_id === user.id) return errorResponse('You cannot purchase your own asset', 400);

    const { data: existing } = await supabaseAdmin
      .from('download_entitlements')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('asset_id', asset.id)
      .maybeSingle();
    if (existing) return errorResponse('Already purchased', 409);

    const priceCents = Number(asset.price_cents);
    if (!Number.isSafeInteger(priceCents) || priceCents <= 0) return errorResponse('Asset price is invalid', 409);
    const currency = String(asset.currency || '').toLowerCase();
    if (!/^[a-z]{3}$/.test(currency)) return errorResponse('Asset currency is invalid', 409);

    const { data: seller } = await supabaseAdmin
      .from('seller_accounts')
      .select('stripe_account_id,charges_enabled,payouts_enabled')
      .eq('user_id', asset.seller_id)
      .maybeSingle();

    const fee = platformFee(priceCents);
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://voxelvault.io').replace(/\/$/, '');
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email || undefined,
      line_items: [{ quantity: 1, price_data: { currency, unit_amount: priceCents, product_data: { name: String(asset.title).slice(0, 500) } } }],
      metadata: { asset_id: asset.id, buyer_id: user.id },
      payment_intent_data: {
        metadata: { asset_id: asset.id, buyer_id: user.id },
        ...(seller?.stripe_account_id && seller.charges_enabled && seller.payouts_enabled
          ? { application_fee_amount: fee, transfer_data: { destination: seller.stripe_account_id } }
          : {}),
      },
      success_url: `${appUrl}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
    }, idempotencyKey ? { idempotencyKey: `voxel-checkout-${idempotencyKey}` } : undefined);

    return NextResponse.json({ url: session.url }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('checkout creation failed', error);
    return errorResponse('Unable to create checkout session', 500);
  }
}
