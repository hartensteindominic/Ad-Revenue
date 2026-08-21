const MAX = 4000;
const BLOCKED = [/private\s*key/i, /seed\s*phrase/i, /mnemonic/i, /api\s*key/i, /password/i];

export function sanitizeCreativeDirection(value = '') {
  const text = String(value).slice(0, MAX).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ').trim();
  if (BLOCKED.some((pattern) => pattern.test(text))) throw new Error('Creative direction contains prohibited secret-like content');
  return text;
}

export function buildSafeAIContext({ seed, family, rarity, subtype, creativeDirection } = {}) {
  if (!seed) throw new Error('AI context requires a deterministic seed');
  return { seed: String(seed), family: String(family || 'other'), rarity: String(rarity || 'common'), subtype: subtype ? String(subtype) : null, creativeDirection: sanitizeCreativeDirection(creativeDirection) };
}
