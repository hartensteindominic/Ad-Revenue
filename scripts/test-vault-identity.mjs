import assert from 'node:assert/strict';
import {
  createVaultId,
  createVaultIdentity,
  getVaultLevel,
  getVaultTitle,
  applyVaultAction,
  getVaultSummary,
} from '../lib/vault-identity.js';

const address = '0x1234567890abcdef1234567890abcdef12345678';
const identity = createVaultIdentity(address);

assert.equal(identity.id, createVaultId(address));
assert.equal(identity.level, undefined);
assert.equal(getVaultLevel(0), 1);
assert.equal(getVaultTitle(1).name, 'New Vault');

const progressed = [
  ['discovery', 4],
  ['mission', 2],
  ['expedition', 1],
  ['verifiedMile', 3],
  ['rareCollectible', 1],
  ['mythicCollectible', 1],
].reduce((current, [action, amount]) => applyVaultAction(current, action, amount), identity);

const summary = getVaultSummary(progressed);
assert.ok(summary.xp > 0);
assert.equal(summary.discoveries, 4);
assert.equal(summary.missions, 2);
assert.equal(summary.expeditions, 1);
assert.equal(summary.rare, 1);
assert.equal(summary.mythic, 1);
assert.equal(summary.distanceMiles, 3);
assert.ok(summary.energy > 0);
assert.match(summary.id, /^VAULT-[0-9A-F]{6}$/);

console.log(`Vault Identity smoke test passed: ${summary.id} · level ${summary.level} · ${summary.xp} XP`);
