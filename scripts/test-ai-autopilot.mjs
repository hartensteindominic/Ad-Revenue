import assert from 'node:assert/strict';
import { analyzeVaultEvents, buildAutopilotPlan } from '../lib/ai/autopilot.js';

const events = [
  { type: 'claim', wallet: '0x1', dropId: 'drop-hot' },
  { type: 'claim', wallet: '0x2', dropId: 'drop-hot' },
  { type: 'claim', wallet: '0x3', dropId: 'drop-hot' },
  { type: 'settlement', wallet: '0x1', valueEth: 0.027 },
  { type: 'error' },
];

const insights = analyzeVaultEvents(events);
assert.ok(insights.some((item) => item.id === 'hot-drop'));
assert.ok(insights.some((item) => item.id === 'settlement-value'));
assert.ok(insights.some((item) => item.id === 'error-rate'));

const plan = buildAutopilotPlan(insights);
assert.equal(plan.every((item) => item.autonomous === true), true);
assert.equal(plan.every((item) => !['transfer_funds', 'grant_ownership', 'deploy'].includes(item.action)), true);

console.log('Voxel Vault bounded AI autopilot tests passed.');
