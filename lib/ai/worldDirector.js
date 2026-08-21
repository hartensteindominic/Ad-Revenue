const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function scoreWorldOpportunity({ distanceM = 9999, freshness = 0, rarity = 'Common', sponsored = false, playerLevel = 1, activePlayers = 0 }) {
  const rarityScore = { Common: 0.1, Uncommon: 0.2, Rare: 0.4, Epic: 0.6, Legendary: 0.8, Mythic: 1 }[rarity] ?? 0.1;
  const proximity = 1 / (1 + Math.max(0, distanceM) / 250);
  const social = 1 - Math.exp(-Math.max(0, activePlayers) / 10);
  const novelty = clamp(freshness, 0, 1);
  const sponsorBoost = sponsored ? 0.04 : 0;
  const progression = clamp(playerLevel / 50, 0, 1) * 0.08;
  return Number(clamp(proximity * 0.5 + rarityScore * 0.18 + novelty * 0.16 + social * 0.12 + sponsorBoost + progression, 0, 1).toFixed(6));
}

export function chooseNextMissions(opportunities, { playerLevel = 1, max = 5 } = {}) {
  return [...(opportunities || [])]
    .map((item) => ({ ...item, aiScore: scoreWorldOpportunity({ ...item, playerLevel }) }))
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, Math.max(1, Math.min(12, max)));
}

export function buildNFTGenerationBrief({ seed, family, rarity, sponsored = false, sponsorLabel = null }) {
  if (!seed || !family || !rarity) throw new Error('seed, family and rarity are required');
  return Object.freeze({
    seed: String(seed),
    family: String(family),
    rarity: String(rarity),
    visualGoals: ['strong silhouette', 'centered composition', 'material realism', 'controlled emissive detail'],
    uniqueness: { deterministic: true, seed: String(seed), variationBudget: 0.18 },
    sponsorship: sponsored ? { disclosed: true, label: sponsorLabel || 'Sponsored Discovery', no_hidden_branding: true } : { disclosed: false },
    mintGate: 'human-or-verified-campaign-approval',
  });
}

export function buildWorldDirectorSnapshot({ player, opportunities }) {
  const missions = chooseNextMissions(opportunities, { playerLevel: Number(player?.level || 1), max: 5 });
  return Object.freeze({ generatedAt: new Date().toISOString(), mode: 'bounded-ai-advisory', missions, actions: ['recommend', 'rank', 'generate-brief'], blocked: ['sign-wallet', 'move-funds', 'mint-without-authorization', 'change-campaign-budget'] });
}
