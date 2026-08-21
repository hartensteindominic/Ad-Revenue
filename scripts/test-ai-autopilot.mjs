import assert from 'node:assert/strict';
import { analyzeVaultEvents, buildAutopilotPlan } from '../lib/ai/autopilot.ts';

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
assert.equal(plan.every((item) => item.action !== 'transfer_funds'), true);
assert.equal(plan.every((item) => item.action !== 'grant_ownership'), true);
assert.equal(plan.every((item) => item.action !== 'deploy'), true);

console.log('Voxel Vault bounded AI autopilot tests passed.');
