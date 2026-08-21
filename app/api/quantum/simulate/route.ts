import { NextResponse } from 'next/server';
import { simulateCircuit } from '../../../../lib/quantum/simulator';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const qubits = Number(body.qubits ?? 2);
    const operations = Array.isArray(body.operations) ? body.operations : [];
    if (operations.length > 64) return NextResponse.json({ error: 'Circuit is too large.' }, { status: 400 });
    return NextResponse.json({ ok: true, simulator: 'Voxel Quantum Lab', exact: true, note: 'Classical state-vector simulation, not access to a quantum computer.', results: simulateCircuit(qubits, operations) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Simulation failed.' }, { status: 400 });
  }
}
