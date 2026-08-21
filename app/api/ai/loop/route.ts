import { NextRequest, NextResponse } from 'next/server';
import { runAgentCycle, type AgentMessage } from '@/lib/ai/agentLoop';
import { sanitizeConversation, sanitizeEvents, clampCycle } from '@/lib/ai/safety';
import type { VaultEvent } from '@/lib/ai/autopilot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 256 * 1024;

export async function POST(request: NextRequest) {
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'AI request is too large.' }, { status: 413 });
    }

    const body = await request.json();
    const events = sanitizeEvents(body?.events) as VaultEvent[];
    const conversation = sanitizeConversation(body?.conversation) as AgentMessage[];
    const cycle = clampCycle(body?.cycle ?? 1, 3);
    const result = await runAgentCycle(events, cycle, conversation);

    return NextResponse.json(
      {
        ...result,
        safety: {
          ownership: 'on-chain-only',
          funds: 'human-approved-only',
          deployment: 'human-approved-only',
          walletAuthorization: 'human-approved-only',
          settlement: 'on-chain-confirmed-only',
          maxCycles: 3,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'AI loop could not process this cycle safely.' }, { status: 400 });
  }
}
