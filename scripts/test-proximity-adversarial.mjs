import assert from 'node:assert/strict';
import {
  createProximityIntent,
  parseProximityIntent,
  PROXIMITY_INTENT_TTL_MS,
} from '../lib/proximity.js';

const now = Date.parse('2026-08-20T12:00:00.000Z');
const intent = createProximityIntent({
  dropId: 'drop-test-001',
  action: 'discover',
  nonce: 'nonce-test-001',
});
intent.createdAt = new Date(now).toISOString();

const parsed = parseProximityIntent(intent, { now });
assert.equal(parsed.dropId, 'drop-test-001');
assert.equal(parsed.nonce, 'nonce-test-001');

assert.throws(
  () => parseProximityIntent({ ...intent, createdAt: new Date(now - PROXIMITY_INTENT_TTL_MS - 1).toISOString() }, { now }),
  /expired/
);
assert.throws(
  () => parseProximityIntent({ ...intent, createdAt: new Date(now + 31_000).toISOString() }, { now }),
  /future/
);
assert.throws(
  () => parseProximityIntent({ ...intent, nonce: '' }, { now }),
  /nonce/
);
assert.throws(
  () => parseProximityIntent({ ...intent, action: 'mint-directly' }, { now }),
  /action/
);
assert.throws(
  () => parseProximityIntent({ ...intent, dropId: 'x'.repeat(129) }, { now }),
  /dropId/
);

console.log('adversarial proximity tests passed');
