import { buildQuantumJob, optimizeVaultPlacement } from '../../../../lib/quantum/worldOptimizer.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const candidates = Array.isArray(body?.candidates) ? body.candidates.slice(0, 100) : [];
    const job = buildQuantumJob({ type: 'vault-placement', input: { count: candidates.length } });
    const ranked = optimizeVaultPlacement(candidates);
    return Response.json({ job, ranked: ranked.slice(0, 25) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: error?.message || 'World optimization failed' }, { status: 400, headers: { 'Cache-Control': 'no-store' } });
  }
}
