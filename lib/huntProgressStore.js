/**
 * Server-side hunt progress (memory + optional Supabase later).
 * Progress is per wallet + hunt. Completing a stop requires a valid claim ticket
 * for the linked drop when stop.type === 'drop'.
 */

import { createDefaultHunts, evaluateHuntProgress, canCompleteStop, isHuntActive } from './scavengerHunt.js';

const memory = {
  hunts: new Map(),
  progress: new Map(), // key: `${huntId}:${wallet}`
};

function key(huntId, wallet) {
  return `${huntId}:${String(wallet).toLowerCase()}`;
}

export function seedDefaultHunts() {
  for (const h of createDefaultHunts()) {
    if (!memory.hunts.has(h.id)) memory.hunts.set(h.id, h);
  }
}

export function listHunts() {
  seedDefaultHunts();
  return [...memory.hunts.values()].filter((h) => h.status === 'active' || h.status === 'scheduled');
}

export function getHunt(id) {
  seedDefaultHunts();
  return memory.hunts.get(id) || null;
}

export function upsertHunt(hunt) {
  memory.hunts.set(hunt.id, hunt);
  return hunt;
}

export function getProgress(huntId, wallet) {
  const k = key(huntId, wallet);
  const existing = memory.progress.get(k);
  if (existing) return existing;
  const blank = {
    huntId,
    wallet: String(wallet).toLowerCase(),
    completedStopIds: [],
    claimTickets: {},
    completedAt: null,
    rewardMinted: false,
    rewardTxHash: null,
  };
  memory.progress.set(k, blank);
  return blank;
}

/**
 * Mark a stop complete after verifying claim ticket for linked drop (client supplies ticket from /api/drops/claim).
 */
export function completeStop({
  huntId,
  wallet,
  stopId,
  claimTicket = null,
} = {}) {
  const hunt = getHunt(huntId);
  if (!hunt) throw new Error('Hunt not found');
  if (!isHuntActive(hunt)) throw new Error('Hunt is not active');

  const walletNorm = String(wallet || '').toLowerCase();
  if (!walletNorm) throw new Error('Wallet required');

  const progress = getProgress(huntId, walletNorm);
  const evaluated = evaluateHuntProgress(hunt, progress.completedStopIds);
  const gate = canCompleteStop(hunt, stopId, evaluated);
  if (!gate.ok) {
    const err = new Error(
      gate.reason === 'out_of_order'
        ? `Complete stop ${gate.nextStopId} first (ordered hunt)`
        : gate.reason === 'already_completed'
          ? 'Stop already completed'
          : 'Cannot complete stop'
    );
    err.code = gate.reason;
    throw err;
  }

  const stop = gate.stop;
  if (stop.type === 'drop' && stop.dropId) {
    if (!claimTicket || typeof claimTicket !== 'string' || claimTicket.length < 8) {
      throw new Error('Valid claim ticket required for this drop stop');
    }
  }

  progress.completedStopIds = [...new Set([...progress.completedStopIds, stopId])];
  if (claimTicket) progress.claimTickets[stopId] = claimTicket;

  const nextEval = evaluateHuntProgress(hunt, progress.completedStopIds);
  if (nextEval.complete && !progress.completedAt) {
    progress.completedAt = new Date().toISOString();
    hunt.completionCount = (hunt.completionCount || 0) + 1;
    memory.hunts.set(hunt.id, hunt);
  }

  memory.progress.set(key(huntId, walletNorm), progress);

  return {
    progress,
    evaluation: nextEval,
    hunt,
    rewardUnlocked: nextEval.complete,
  };
}

export function markRewardMinted(huntId, wallet, txHash) {
  const progress = getProgress(huntId, wallet);
  progress.rewardMinted = true;
  progress.rewardTxHash = txHash || null;
  memory.progress.set(key(huntId, wallet), progress);
  return progress;
}
