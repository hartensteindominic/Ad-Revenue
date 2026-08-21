const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

export function critiqueAssetPlan(plan = {}, collectionFingerprints = []) {
  const uniqueness = clamp(plan.uniquenessScore ?? (plan.visualDNA?.mutationBudget || 1) * 9 + 35);
  const realism = clamp(plan.realismScore ?? 72);
  const presentation = clamp(plan.presentationScore ?? 78);
  const familySpecificity = clamp(plan.familySpecificity ?? (plan.geometryPlan?.family ? 82 : 45));
  const duplicateRisk = collectionFingerprints.includes(plan.fingerprint) ? 100 : clamp(plan.duplicateRisk ?? 8);
  const score = Math.round((uniqueness * 0.35) + (realism * 0.30) + (presentation * 0.20) + (familySpecificity * 0.15) - duplicateRisk * 0.25);
  const warnings = [];
  if (uniqueness < 70) warnings.push('Increase structural variation');
  if (realism < 70) warnings.push('Improve material or construction coherence');
  if (presentation < 70) warnings.push('Improve silhouette/framing readiness');
  if (duplicateRisk > 60) warnings.push('Potential collection collision');
  return { score: clamp(score), approved: score >= 78 && duplicateRisk < 60, metrics: { uniqueness, realism, presentation, familySpecificity, duplicateRisk }, warnings };
}

export function buildRegenerationBrief(plan, critique) {
  if (critique?.approved) return null;
  return {
    seed: plan?.seed,
    preserve: ['family identity', 'rarity tier', 'canonical visual DNA'],
    improve: critique?.warnings || ['increase uniqueness'],
    maxAttempts: 3,
  };
}
