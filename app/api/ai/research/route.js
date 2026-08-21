import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_QUERY = 1200;

export async function POST(request) {
  try {
    const body = await request.json();
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    if (!query || query.length > MAX_QUERY) return NextResponse.json({ error: 'Enter a shorter research question.' }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Live AI research is not configured. Add OPENAI_API_KEY in the deployment environment.' }, { status: 503 });

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.VOXEL_AI_RESEARCH_MODEL || 'gpt-5.6',
        input: `You are Voxel Vault Research. Research the user's question using current web information. Prefer primary sources and clearly distinguish verified facts, estimates, and uncertainty. Explain why a source matters. Do not invent citations. User question: ${query}`,
        tools: [{ type: 'web_search' }],
        store: false,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('OpenAI research error', data);
      return NextResponse.json({ error: 'Live research failed.' }, { status: 502 });
    }
    return NextResponse.json({ ok: true, answer: data.output_text || '', responseId: data.id || null });
  } catch (error) {
    console.error('AI research failed', error);
    return NextResponse.json({ error: 'Unable to run live research.' }, { status: 500 });
  }
}
