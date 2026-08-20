import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  collectible: await readFile(new URL('../lib/universalCollectible.js', import.meta.url), 'utf8'),
  generation: await readFile(new URL('../lib/generation/realisticRules.js', import.meta.url), 'utf8'),
  drops: await readFile(new URL('../lib/dropEngine.js', import.meta.url), 'utf8'),
  trading: await readFile(new URL('../lib/tradingEngine.js', import.meta.url), 'utf8'),
};

assert.match(files.collectible, /voxel-vault\\/universal-collectible/);
assert.match(files.collectible, /procedural.*ai_assisted.*creator_upload/s);
assert.match(files.collectible, /collectibleFingerprint/);
assert.match(files.generation, /vehicles/);
assert.match(files.generation, /technology/);
assert.match(files.generation, /creatures/);
assert.match(files.generation, /validateGenerationRequest/);
assert.match(files.drops, /prepareClaim/);
assert.match(files.drops, /isWithinDropZone/);
assert.match(files.drops, /maxClaimsPerWallet/);
assert.match(files.trading, /createTradeOffer/);
assert.match(files.trading, /canAcceptTrade/);
assert.match(files.trading, /transitionTrade/);

console.log('Universal engine source smoke checks passed.');
