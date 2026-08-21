import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';
import { fetchKnowledgeSource } from '../../../../lib/ai/webKnowledge';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await request.json();
    if (typeof body.url !== 'string' || body.url.length > 2048) return NextResponse.json({ error: 'A valid HTTPS source URL is required.' }, { status: 400 });
    const source = await fetchKnowledgeSource(body.url);
    return NextResponse.json({ ok: true, source: { url: source.url, contentType: source.contentType, text: source.text } }, { headers: { 'cache-control': 'no-store' } });
  } catch (error) {
    console.error('web knowledge fetch failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to read source.' }, { status: 400 });
  }
}
