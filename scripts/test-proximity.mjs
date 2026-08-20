import assert from 'node:assert/strict';
import { createProximityIntent, parseProximityIntent } from '../lib/proximity.js';

const intent = createProximityIntent({ dropId: 'drop-test-001', action: 'discover', nonce: 'nonce-test' });
assert.equal(intent.kind, 'voxel-vault-proximity');
assert.equal(intent.dropId, 'drop-test-001');
assert.equal(intent.nonce, 'nonce-test');

const parsed = parseProximityIntent(intent);
assert.deepEqual(parsed, {
  version: 1,
  action: 'discover',
  dropId: 'drop-test-001',
  nonce: 'nonce-test',
  createdAt: intent.createdAt,
});

assert.throws(() => parseProximityIntent({ kind: 'wrong', dropId: 'x', nonce: 'y' }));
assert.throws(() => createProximityIntent({}));

console.log('proximity tests: PASS');
