import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await request.json();
    const merchantId = typeof body.merchantId === 'string' ? body.merchantId.trim() : '';
    const receiptReference = typeof body.receiptReference === 'string' ? body.receiptReference.trim() : '';
    const signature = typeof body.signature === 'string' ? body.signature.trim() : '';
    const amountCents = Number.isInteger(body.amountCents) ? body.amountCents : 0;
    const category = typeof body.category === 'string' ? body.category.trim().toLowerCase() : 'purchase';
    if (!merchantId || !receiptReference || !signature || amountCents < 50) return NextResponse.json({ error: 'Signed merchant receipt required' }, { status: 400 });
    if (receiptReference.length > 128 || merchantId.length > 128 || signature.length > 4096) return NextResponse.json({ error: 'Invalid receipt data' }, { status: 400 });
    // The signature must be verified by a configured merchant adapter before mint authorization.
    // Client assertions, screenshots, or raw receipt text are never sufficient proof of payment.
    return NextResponse.json({ ok: true, status: 'verification_pending', userId: user.id, merchantId, receiptReference, amountCents, category }, { status: 202 });
  } catch (error) {
    console.error('merchant receipt intake failed', error);
    return NextResponse.json({ error: 'Unable to process receipt' }, { status: 500 });
  }
}
