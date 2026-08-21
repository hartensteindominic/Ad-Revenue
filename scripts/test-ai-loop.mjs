import assert from 'node:assert/strict';
import { runAgentCycle } from '../lib/ai/agentLoop.js';

const result = await runAgentCycle([
  { type: 'claim', wallet: '0x1', dropId: 'hot-drop' },
  { type: 'claim', wallet: '0x2', dropId: 'hot-drop' },
  { type: 'claim', wallet: '0x3', dropId: 'hot-drop' },
  { type: 'settlement', valueEth: 0.027 },
]);

assert.equal(result.autonomous, true);
assert.equal(result.cycle, 1);
assert.ok(result.reply.length > 0);
assert.ok(result.insights.length > 0);
assert.ok(result.nextPrompt.length > 0);
assert.equal(result.plan.every((item) => !['transfer_funds', 'grant_ownership', 'deploy', 'bypass_settlement'].includes(item.action)), true);

const capped = await runAgentCycle([], 99);
assert.equal(capped.cycle, 3);
assert.match(capped.nextPrompt, /new bounded cycle/i);

console.log('Voxel Vault bounded conversational AI loop tests passed.');
