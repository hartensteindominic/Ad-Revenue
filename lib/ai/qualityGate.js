import { RARITIES } from '@/lib/universalCollectible';

const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, Number(n) || 0));

export function scoreAssetPlan(plan = {}) {
  const dna = plan.visualDNA || {};
  const geometry = plan.geometry || {};
  const realism = plan.realism || {};
  const rarityIndex = Math.max(0, RARITIES.indexOf(plan.rarity));
  const uniqueness = clamp((dna.mutationBudget || 0) / 9 * 0.45 + (dna.variant ? 0.2 : 0) + (geometry.asymmetry || 0) * 0.35);
  const realismScore = clamp((realism.plausibility === 'high' ? 0.55 : 0.3) + (realism.surfaceVariation || 0) * 0.25 + (realism.detailDensity || 0) * 0.2);
  const presentation = clamp(0.55 + Math.min(0.3, rarityIndex * 0.04) + ((plan.presentation?.scale || 1) > 0 ? 0.1 : 0));
  const score = Math.round((uniqueness * 0.4 + realismScore * 0.4 + presentation * 0.2) * 100);
  const warnings = [];
  if (uniqueness < 0.35) warnings.push('Increase structural variation');
  if (realismScore < 0.6) warnings.push('Increase realistic surface/detail treatment');
  if (!plan.seed) warnings.push('Missing deterministic seed');
  return { score, uniqueness: Math.round(uniqueness * 100), realism: Math.round(realismScore * 100), presentation: Math.round(presentation * 100), pass: score >= 70 && warnings.length === 0, warnings };
}

export function enforceAssetQuality(plan) {
  const quality = scoreAssetPlan(plan);
  if (!quality.pass) throw new Error(`Asset quality gate failed: ${quality.warnings.join('; ')}`);
  return { ...plan, quality };
}
