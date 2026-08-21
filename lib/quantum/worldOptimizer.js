function normalize(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }

export function optimizeVaultPlacement(candidates, { rewardWeight = 0.35, discoveryWeight = 0.35, distanceWeight = 0.2, safetyWeight = 0.1 } = {}) {
  const weights = [rewardWeight, discoveryWeight, distanceWeight, safetyWeight].map(normalize);
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) throw new Error('Quantum optimizer weights must contain a positive total');
  const [rw, dw, distw, sw] = weights.map((v) => v / total);
  return [...(candidates || [])].map((candidate) => {
    const reward = normalize(candidate.rewardPotential);
    const discovery = normalize(candidate.discoveryPotential);
    const distance = 1 - Math.min(1, Math.max(0, normalize(candidate.distanceCost)));
    const safety = normalize(candidate.safetyScore);
    return { ...candidate, quantumScore: Number((rw * reward + dw * discovery + distw * distance + sw * safety).toFixed(6)) };
  }).sort((a, b) => b.quantumScore - a.quantumScore);
}

export function optimizeCampaignBudget(candidates, budgetCents) {
  if (!Number.isSafeInteger(budgetCents) || budgetCents <= 0) throw new Error('budgetCents must be a positive safe integer');
  const ranked = optimizeVaultPlacement(candidates);
  const totalDemand = ranked.reduce((sum, item) => sum + Math.max(1, normalize(item.demand)), 0) || 1;
  return ranked.map((item) => ({ ...item, suggestedBudgetCents: Math.max(1, Math.floor(budgetCents * Math.max(1, normalize(item.demand)) / totalDemand)) }));
}

export function buildQuantumJob({ type, input }) {
  if (!type) throw new Error('Quantum job type is required');
  return Object.freeze({ id: `qjob-${Date.now().toString(36)}`, type: String(type), input: input || {}, provider: process.env.QUANTUM_PROVIDER || 'deterministic-simulator', status: 'research', disclaimer: 'Simulation/research adapter. No claim of quantum hardware execution.' });
}
