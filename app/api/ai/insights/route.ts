import { NextRequest, NextResponse } from 'next/server';
import { analyzeVaultEvents, buildAutopilotPlan } from '@/lib/ai/autopilot.js';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events = Array.isArray(body?.events) ? body.events.slice(-500) : [];
    const insights = analyzeVaultEvents(events);
    const plan = buildAutopilotPlan(insights);

    return NextResponse.json(
      { insights, plan, processedEvents: events.length, autonomousMode: 'bounded' },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Invalid insight request' }, { status: 400 });
  }
}
