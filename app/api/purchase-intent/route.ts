import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const assetId = typeof body.assetId === 'string' ? body.assetId : '';
    const handoffMethod = body.handoffMethod === 'delivery' || body.handoffMethod === 'fulfillment' ? body.handoffMethod : 'pickup';
    if (!assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 400 });

    const { data: asset, error: assetError } = await supabase.from('assets').select('id,seller_id,status,price_cents,currency').eq('id', assetId).eq('status', 'published').single();
    if (assetError || !asset) return NextResponse.json({ error: 'Object unavailable' }, { status: 404 });
    if (asset.seller_id === user.id) return NextResponse.json({ error: 'You cannot purchase your own object' }, { status: 400 });

    const { data: object, error: objectError } = await supabase.from('voxel_objects').select('id,voxel_id,status').eq('asset_id', asset.id).single();
    if (objectError || !object) return NextResponse.json({ error: 'NFT identity is not attached to this object' }, { status: 409 });
    if (!['listed'].includes(object.status)) return NextResponse.json({ error: 'Object is no longer available' }, { status: 409 });

    const { data: existing } = await supabase.from('physical_claims').select('id,status').eq('voxel_object_id', object.id).in('status', ['pending','reserved','qr_verified','mint_pending']).maybeSingle();
    if (existing) return NextResponse.json({ error: 'Object is already reserved' }, { status: 409 });

    const { data: order, error: orderError } = await supabase.from('orders').insert({ buyer_id: user.id, currency: asset.currency, subtotal_cents: asset.price_cents, platform_fee_cents: 0, status: 'pending' }).select('id').single();
    if (orderError || !order) throw orderError ?? new Error('Unable to create order');
    const { error: itemError } = await supabase.from('order_items').insert({ order_id: order.id, asset_id: asset.id, seller_id: asset.seller_id, unit_amount_cents: asset.price_cents });
    if (itemError) throw itemError;
    const { error: claimError } = await supabase.from('physical_claims').insert({ voxel_object_id: object.id, order_id: order.id, buyer_id: user.id, handoff_method: handoffMethod, status: 'pending' });
    if (claimError) throw claimError;
    const { error: objectUpdateError } = await supabase.from('voxel_objects').update({ status: 'checkout_pending', updated_at: new Date().toISOString() }).eq('id', object.id).eq('status', 'listed');
    if (objectUpdateError) throw objectUpdateError;
    return NextResponse.json({ orderId: order.id, voxelId: object.voxel_id, amountCents: asset.price_cents, currency: asset.currency });
  } catch (error) {
    console.error('purchase intent failed', error);
    return NextResponse.json({ error: 'Unable to start purchase' }, { status: 500 });
  }
}
