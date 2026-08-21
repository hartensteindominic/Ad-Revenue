export const IDLE_RULES = Object.freeze({
  maxSessionMinutes: 180,
  energyPerMinute: 1,
  dailyEnergyCap: 240,
});

export function clampIdleMinutes(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(Math.floor(value), IDLE_RULES.maxSessionMinutes);
}

export function accrueEnergy({ minutes, currentEnergy = 0, earnedToday = 0 }) {
  const safeMinutes = clampIdleMinutes(minutes);
  const today = Math.max(0, Number(earnedToday) || 0);
  const remaining = Math.max(0, IDLE_RULES.dailyEnergyCap - today);
  const earned = Math.min(safeMinutes * IDLE_RULES.energyPerMinute, remaining);
  return { minutes: safeMinutes, earned, energy: Math.max(0, Number(currentEnergy) || 0) + earned, capped: earned < safeMinutes * IDLE_RULES.energyPerMinute };
}

export function getReactorState(now = Date.now(), saved = {}) {
  const startedAt = Number(saved.startedAt) || 0;
  const active = Boolean(saved.active && startedAt > 0);
  const elapsedMinutes = active ? Math.max(0, (now - startedAt) / 60000) : 0;
  return { active, elapsedMinutes, capped: elapsedMinutes >= IDLE_RULES.maxSessionMinutes };
}

export function spendEnergy(balance, amount) {
  const safeBalance = Math.max(0, Number(balance) || 0);
  const safeAmount = Math.max(0, Math.floor(Number(amount) || 0));
  if (safeAmount > safeBalance) throw new Error('Not enough Vault Energy.');
  return safeBalance - safeAmount;
}

export function createExpedition({ id, minutes = 15, energyCost = 10, label = 'Scout a nearby Vault' }) {
  return { id: String(id), label, minutes: clampIdleMinutes(minutes), energyCost: Math.max(0, Math.floor(energyCost)), rewardType: 'verified-progress' };
}
