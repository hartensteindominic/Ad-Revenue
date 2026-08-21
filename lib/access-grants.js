const ROLES = new Set(['view', 'enter', 'collect', 'create', 'admin']);

export function createAccessGrant({ owner, grantee, vaultId, role = 'view', expiresAt = null } = {}) {
  if (!owner || !grantee || !vaultId) throw new Error('owner, grantee and vaultId are required');
  if (!ROLES.has(role)) throw new Error('Unsupported access role');
  if (owner.toLowerCase() === grantee.toLowerCase()) throw new Error('Owner does not need a grant');
  if (expiresAt !== null && (!Number.isFinite(Number(expiresAt)) || Number(expiresAt) <= Date.now())) throw new Error('Grant expiry must be in the future');
  return {
    id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    owner,
    grantee,
    vaultId,
    role,
    createdAt: Date.now(),
    expiresAt: expiresAt === null ? null : Number(expiresAt),
    revokedAt: null,
  };
}

export function isGrantActive(grant, now = Date.now()) {
  if (!grant || grant.revokedAt) return false;
  return grant.expiresAt === null || Number(grant.expiresAt) > now;
}

export function canAccess(grant, role, now = Date.now()) {
  if (!isGrantActive(grant, now)) return false;
  if (!ROLES.has(role)) return false;
  if (grant.role === 'admin') return true;
  const rank = { view: 1, enter: 2, collect: 3, create: 4, admin: 5 };
  return rank[grant.role] >= rank[role];
}

export function revokeAccessGrant(grant, now = Date.now()) {
  if (!grant || grant.revokedAt) return grant;
  return { ...grant, revokedAt: now };
}

export function listAccessRoles() {
  return Array.from(ROLES);
}
