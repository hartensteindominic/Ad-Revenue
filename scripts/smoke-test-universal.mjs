import assert from 'node:assert/strict';
import { createUniversalCollectible, validateUniversalCollectible, collectibleFingerprint } from '../lib/universalCollectible.js';
import { createDrop, isDropDiscoverable, isWithinDropZone, prepareClaim } from '../lib/dropEngine.js';
import { createTradeOffer, canAcceptTrade, transitionTrade } from '../lib/tradingEngine.js';

const collectible = createUniversalCollectible({
  name: 'Test Camera',
  family: 'technology',
  subtype: 'camera',
  creationMode: 'procedural',
  seed: 'camera-smoke-001',
  rarity: 'rare',
});

assert.equal(validateUniversalCollectible(collectible).valid, true);
assert.equal(typeof collectibleFingerprint(collectible), 'string');
assert.notEqual(collectibleFingerprint(collectible), '');

const drop = createDrop({
  id: 'drop-smoke',
  name: 'Smoke Drop',
  quantity: 3,
  status: 'active',
  radiusMeters: 50,
  maxClaimsPerWallet: 1,
});

assert.equal(isDropDiscoverable(drop, new Date()), true);
assert.equal(isWithinDropZone(drop, 25), true);
assert.equal(isWithinDropZone(drop, 51), false);
assert.equal(prepareClaim({ drop, collectible, walletAddress: '0xabc', distanceMeters: 25 }).type, 'claim-intent');

const offer = createTradeOffer({ offerer: '0xaaa', recipient: '0xbbb', offered: [collectible.id || 'test-asset'] });
assert.equal(canAcceptTrade(offer, '0xBBB'), true);
const accepted = transitionTrade(offer, 'accepted');
assert.equal(accepted.state, 'accepted');
const submitted = transitionTrade(accepted, 'submitted');
assert.equal(submitted.state, 'submitted');

console.log('Universal engine smoke checks passed.');
