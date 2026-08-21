import { NextRequest, NextResponse } from 'next/server';
import { runAgentCycle, type AgentMessage } from '@/lib/ai/agentLoop';
import type { VaultEvent } from '@/lib/ai/autopilot';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events: VaultEvent[] = Array.isArray(body?.events) ? body.events.slice(-500) : [];
    const conversation: AgentMessage[] = Array.isArray(body?.conversation) ? body.conversation.slice(-12) : [];
    const cycle = Number(body?.cycle ?? 1);

    const result = await runAgentCycle(events, cycle, conversation);

    return NextResponse.json(
      {
        ...result,
        safety: {
          ownership: 'on-chain-only',
          funds: 'human-approved-only',
          deployment: 'human-approved-only',
          settlement: 'on-chain-confirmed-only',
          maxCycles: 3,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'AI loop could not process this cycle' }, { status: 400 });
  }
}
