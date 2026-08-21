import assert from 'node:assert/strict';
import { createAccessGrant, canAccess, revokeAccessGrant, isGrantActive } from './access-grants.js';

const now = Date.now();
const grant = createAccessGrant({ owner: '0xowner', grantee: '0xguest', vaultId: 'vault-1', role: 'collect', expiresAt: now + 60_000 });
assert.equal(isGrantActive(grant, now), true);
assert.equal(canAccess(grant, 'view', now), true);
assert.equal(canAccess(grant, 'collect', now), true);
assert.equal(canAccess(grant, 'create', now), false);
const revoked = revokeAccessGrant(grant, now + 1);
assert.equal(isGrantActive(revoked, now + 1), false);
assert.equal(canAccess(revoked, 'view', now + 1), false);
console.log('access-grants: PASS');
