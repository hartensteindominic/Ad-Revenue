import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

const MAX_PROMPT = 4000;

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const auth = request.headers.get('authorization');
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const objectId = typeof body.objectId === 'string' ? body.objectId.trim() : null;
    if (!prompt || prompt.length > MAX_PROMPT) return NextResponse.json({ error: 'Prompt must be 1–4000 characters.' }, { status: 400 });

    let context = null;
    if (objectId) {
      const { data } = await supabase.from('voxel_objects').select('id,voxel_id,status,nft_contract_address,nft_token_id,metadata_uri').eq('id', objectId).maybeSingle();
      context = data || null;
    }

    const system = process.env.VOXEL_AI_ENDPOINT;
    if (!system) return NextResponse.json({ mode: 'local', answer: 'AI gateway is ready. Connect an approved model provider to enable live answers.', context });
    const response = await fetch(system, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.VOXEL_AI_API_KEY || ''}` }, body: JSON.stringify({ userId: user.id, prompt, context }) });
    if (!response.ok) return NextResponse.json({ error: 'AI provider unavailable.' }, { status: 502 });
    const data = await response.json();
    return NextResponse.json({ answer: typeof data.answer === 'string' ? data.answer.slice(0, 12000) : 'No answer returned.', context });
  } catch (error) {
    console.error('AI gateway failed', error);
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 });
  }
}
