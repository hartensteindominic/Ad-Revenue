// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const { assetId } = await request.json();
    if (!assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 400 });

    const { data: entitlement, error: entitlementError } = await supabaseAdmin
      .from('download_entitlements')
      .select('id,asset_id')
      .eq('buyer_id', user.id)
      .eq('asset_id', assetId)
      .maybeSingle();
    if (entitlementError || !entitlement) return NextResponse.json({ error: 'Purchase required' }, { status: 403 });

    const { data: asset, error: assetError } = await supabaseAdmin
      .from('assets')
      .select('storage_path,title')
      .eq('id', assetId)
      .single();
    if (assetError || !asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    const { data: signed, error: signedError } = await supabaseAdmin.storage
      .from('assets-private')
      .createSignedUrl(asset.storage_path, 60);
    if (signedError || !signed?.signedUrl) return NextResponse.json({ error: 'Download unavailable' }, { status: 503 });

    return NextResponse.json({ url: signed.signedUrl, expiresIn: 60 });
  } catch (error) {
    console.error('download authorization failed', error);
    return NextResponse.json({ error: 'Download unavailable' }, { status: 500 });
  }
}
