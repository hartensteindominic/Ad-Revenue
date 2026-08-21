export function evaluateVaultPolicy({ vault, now = Date.now(), distanceMeters } = {}) {
  if (!vault) return { allowed: false, reason: 'missing-vault' };
  const unlockAt = vault.unlockAt ? Date.parse(vault.unlockAt) : null;
  if (unlockAt && now < unlockAt) return { allowed: false, reason: 'time-locked', unlockAt };
  if (vault.radiusMeters != null) {
    if (!Number.isFinite(distanceMeters)) return { allowed: false, reason: 'location-proof-required' };
    if (distanceMeters > Number(vault.radiusMeters)) return { allowed: false, reason: 'outside-radius', distanceMeters };
  }
  if (vault.expiresAt && now > Date.parse(vault.expiresAt)) return { allowed: false, reason: 'expired' };
  return { allowed: true, reason: 'verified-policy' };
}
