import { NextResponse } from 'next/server';
import { stripe } from '../../../lib/stripe-server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

const MINT_PRICE_CENTS = 299;

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Sign in to mint a collectible.' }, { status: 401 });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Sign in to mint a collectible.' }, { status: 401 });

    const body = await request.json();
    const receiptId = typeof body.receiptId === 'string' ? body.receiptId.trim() : '';
    const collectibleId = typeof body.collectibleId === 'string' ? body.collectibleId.trim() : '';
    if (!receiptId || !collectibleId || receiptId.length > 128 || collectibleId.length > 128) return NextResponse.json({ error: 'Invalid receipt or collectible.' }, { status: 400 });

    // Do not trust the browser to assert that a receipt was paid. A production merchant adapter
    // must verify the receipt and persist the verified purchase before this checkout can mint.
    const { data: verifiedReceipt } = await supabase.from('verified_receipts').select('id,status').eq('id', receiptId).eq('user_id', user.id).eq('status', 'verified').maybeSingle();
    if (!verifiedReceipt) return NextResponse.json({ error: 'This receipt has not been verified by a participating merchant yet.' }, { status: 409 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://voxel-vault.vercel.app';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email || undefined,
      line_items: [{ quantity: 1, price_data: { currency: 'usd', unit_amount: MINT_PRICE_CENTS, product_data: { name: 'Voxel Vault collectible mint' } } }],
      metadata: { kind: 'receipt_collectible_mint', receipt_id: receiptId, collectible_id: collectibleId, buyer_id: user.id },
      payment_intent_data: { metadata: { kind: 'receipt_collectible_mint', receipt_id: receiptId, collectible_id: collectibleId, buyer_id: user.id } },
      success_url: `${appUrl}/room?mint=processing`,
      cancel_url: `${appUrl}/receipt?mint=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('receipt mint checkout failed', error);
    return NextResponse.json({ error: 'Unable to start mint checkout.' }, { status: 500 });
  }
}
