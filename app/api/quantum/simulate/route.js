import { NextResponse } from 'next/server';
import { simulateBellState } from '@/lib/quantum/statevector';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const experiment = body.experiment || 'bell';
    if (experiment !== 'bell') return NextResponse.json({ error: 'Supported experiment: bell' }, { status: 400 });
    return NextResponse.json({ ok: true, simulator: 'local-statevector', hardware: false, experiment, states: simulateBellState(), note: 'This is a classical simulation of a small quantum circuit, not access to a physical quantum processor.' });
  } catch (error) {
    console.error('quantum simulation failed', error);
    return NextResponse.json({ error: 'Quantum simulation failed.' }, { status: 500 });
  }
}
