const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function scoreMission(input = {}) {
  const proximity = clamp(Number(input.proximityScore) || 0, 0, 1);
  const freshness = clamp(Number(input.freshnessScore) || 0, 0, 1);
  const novelty = clamp(Number(input.noveltyScore) || 0, 0, 1);
  const completion = clamp(Number(input.completionScore) || 0, 0, 1);
  const antiFraud = clamp(Number(input.antiFraudScore) || 0, 0, 1);
  const score = proximity * 0.25 + freshness * 0.15 + novelty * 0.15 + completion * 0.2 + antiFraud * 0.25;
  return { score: Number(score.toFixed(4)), eligible: score >= 0.65 && antiFraud >= 0.7, signals: { proximity, freshness, novelty, completion, antiFraud } };
}

export function chooseMission(candidates = []) {
  return [...candidates].map((mission) => ({ mission, evaluation: scoreMission(mission) })).filter(({ evaluation }) => evaluation.eligible).sort((a, b) => b.evaluation.score - a.evaluation.score)[0] ?? null;
}
