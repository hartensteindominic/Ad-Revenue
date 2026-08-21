export const REWARD_STAGES = Object.freeze([
  'busy', 'reactor', 'energy', 'mission-queued', 'verified', 'eligible', 'claimable', 'claimed', 'reinvested', 'recycled'
]);

export function createMissionQueue() { return []; }

export function queueMission(queue, mission, energy) {
  if (!mission?.id) throw new Error('Mission id is required.');
  if (queue.some(item => item.id === mission.id)) throw new Error('Mission is already queued.');
  if (energy < mission.energyCost) throw new Error('Not enough Vault Energy.');
  return [...queue, { ...mission, stage: 'mission-queued', queuedAt: Date.now() }];
}

export function markVerified(queue, missionId, proof) {
  if (!proof?.verified || !proof?.id) throw new Error('Verified proof is required.');
  return queue.map(item => item.id === missionId ? { ...item, stage: 'verified', proofId: proof.id, verifiedAt: Date.now() } : item);
}

export function makeEligibility(item, rules = {}) {
  const minimumScore = Number(rules.minimumScore ?? 1);
  const score = Number(item?.score ?? 0);
  const verified = item?.stage === 'verified' && Boolean(item?.proofId);
  return { eligible: verified && score >= minimumScore, stage: verified && score >= minimumScore ? 'eligible' : item?.stage ?? 'mission-queued' };
}

export function createClaimIntent(item, walletAddress) {
  if (!item || item.stage !== 'eligible') throw new Error('Mission is not eligible for a claim.');
  if (!walletAddress) throw new Error('Wallet confirmation is required.');
  return { missionId: item.id, proofId: item.proofId, walletAddress, stage: 'claimable', createdAt: Date.now() };
}

export function recordClaim(intent, txHash) {
  if (!intent?.proofId || !txHash) throw new Error('Verified transaction hash is required.');
  return { ...intent, txHash, stage: 'claimed', claimedAt: Date.now() };
}

export function recordReinvestment(claim, allocation) {
  if (!claim?.txHash) throw new Error('Only claimed rewards can be reinvested.');
  const amount = Math.max(0, Number(allocation) || 0);
  return { ...claim, reinvestment: amount, stage: 'reinvested', reinvestedAt: Date.now() };
}
