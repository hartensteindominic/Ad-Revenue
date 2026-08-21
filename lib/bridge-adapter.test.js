import assert from 'node:assert/strict';
import { createBridgePreview, listBridgeChains } from './bridge-adapter.js';

assert.equal(listBridgeChains().length, 4);
const preview = createBridgePreview({ tokenId: 7, from: 'ethereum', to: 'base' });
assert.equal(preview.status, 'preview-only');
assert.equal(preview.userFundsLocked, false);
assert.equal(preview.requiresAuditedProvider, true);
assert.equal(preview.replayProtectionRequired, true);
assert.throws(() => createBridgePreview({ tokenId: 7, from: 'ethereum', to: 'ethereum' }));
console.log('bridge-adapter: PASS');
