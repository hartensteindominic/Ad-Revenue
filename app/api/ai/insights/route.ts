import { NextRequest, NextResponse } from 'next/server';
import { analyzeVaultEvents, buildAutopilotPlan } from '@/lib/ai/autopilot';
import { sanitizeEvents } from '@/lib/ai/safety';
import { getClientIp, rateLimit, rateLimitHeaders } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const limit = rateLimit(`ai-insights:${getClientIp(request)}`);
  const headers = rateLimitHeaders(limit);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded. Please retry shortly.' }, { status: 429, headers });
  }

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 256 * 1024) {
      return NextResponse.json({ error: 'Insight request is too large.' }, { status: 413, headers });
    }

    const body = await request.json();
    const events = sanitizeEvents(body?.events);
    const insights = analyzeVaultEvents(events);
    const plan = buildAutopilotPlan(insights);

    return NextResponse.json(
      { insights, plan, processedEvents: events.length, autonomousMode: 'bounded' },
      { headers },
    );
  } catch {
    return NextResponse.json({ error: 'Invalid insight request' }, { status: 400, headers });
  }
}
