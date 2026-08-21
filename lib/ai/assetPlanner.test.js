import assert from 'node:assert/strict';
import { createAssetPlan } from './assetPlanner.js';

const a = createAssetPlan({ seed: 'dragon-001', family: 'fantasy', rarity: 'mythic' });
const b = createAssetPlan({ seed: 'dragon-001', family: 'fantasy', rarity: 'mythic' });
const c = createAssetPlan({ seed: 'dragon-002', family: 'fantasy', rarity: 'mythic' });

assert.deepEqual(a, b);
assert.notDeepEqual(a.visualDNA, c.visualDNA);
assert.equal(a.format, undefined);
assert.equal(a.subtype.length > 0, true);
assert.equal(a.geometry.microDetailPasses >= 1, true);

console.log('asset planner smoke test passed');
