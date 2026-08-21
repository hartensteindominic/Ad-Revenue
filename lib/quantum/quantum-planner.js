/**
 * Quantum-inspired planning adapter.
 *
 * This does not claim to perform quantum computation. It provides a deterministic
 * optimization interface today and leaves a provider boundary for a real quantum
 * backend/simulator later.
 */

function cost(candidate, context) {
  const distance = Math.max(0, Number(candidate.distance) || 0);
  const crowd = Math.max(0, Number(candidate.crowdScore) || 0);
  const novelty = Math.max(0, Number(candidate.novelty) || 0);
  const reward = Math.max(0, Number(candidate.reward) || 0);
  const safety = Math.max(0, Number(candidate.safety) || 0);
  const preference = context?.preference ?? 0.5;
  return distance * 0.2 + crowd * 0.15 + safety * 0.2 - reward * 0.3 - novelty * 0.15 - preference * 0.1;
}

export function optimizeVaultCandidates(candidates = [], context = {}) {
  return [...candidates].sort((a, b) => cost(a, context) - cost(b, context)).slice(0, Math.max(1, context.limit || 3));
}

export function createQuantumJob({ candidates = [], context = {} } = {}) {
  return {
    algorithm: 'vault-route-qaoa-inspired-v1',
    provider: 'deterministic-local',
    status: 'ready',
    inputs: candidates.length,
    solution: optimizeVaultCandidates(candidates, context),
  };
}
