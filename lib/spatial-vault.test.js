import assert from 'node:assert/strict';
import { normalizeAnchor, distanceMeters, isInRange, buildClaimIntent } from './spatial-vault.js';

const anchor = normalizeAnchor({ id: 'room-1', lat: 42.8864, lng: -78.8784, radiusM: 50, indoor: true, roomId: 'living-room', privacy: 'private' });
assert.equal(anchor.indoor, true);
assert.equal(anchor.privacy, 'private');
assert.ok(distanceMeters(anchor, { lat: 42.8864, lng: -78.8784 }) < 1);
assert.equal(isInRange(anchor, { lat: 42.8864, lng: -78.8784 }), true);
assert.equal(isInRange(anchor, { lat: 42.8875, lng: -78.8784 }), false);
const intent = buildClaimIntent(anchor, { lat: 42.8864, lng: -78.8784 }, { wallet: '0xabc' });
assert.equal(intent.eligible, true);
assert.equal(intent.requiresExplicitWalletConfirmation, true);
console.log('spatial-vault: PASS');
