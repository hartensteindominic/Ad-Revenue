import assert from 'node:assert/strict';
import { canCollectWithoutCamera, getCollectionPresentation } from '../config/collectionExperience.js';

assert.equal(canCollectWithoutCamera(), true, 'camera must never be required for ordinary collection');

const distant = getCollectionPresentation({ distanceMeters: 80, rarity: 'rare', sponsored: true });
assert.equal(distant.primaryAction, 'APPROACH');
assert.equal(distant.cameraRequired, false);
assert.equal(distant.showArPeek, true);

const nearby = getCollectionPresentation({ distanceMeters: 8, rarity: 'epic', sponsored: false });
assert.equal(nearby.primaryAction, 'COLLECT');
assert.equal(nearby.cameraRequired, false);

console.log('collection experience: PASS');
