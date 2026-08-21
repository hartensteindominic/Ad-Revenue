import assert from 'node:assert/strict';
import { createQuantumJob, simulateQuantumJob, quantumSecurityPosture } from './quantum-research.js';

const job = createQuantumJob({ algorithm: 'asset-search', input: { candidates: 8 }, seed: 'alpha' });
const result = simulateQuantumJob(job);
assert.equal(result.provider, 'simulation');
assert.equal(result.quantumHardwareUsed, false);
assert.equal(result.result.deterministic, true);
assert.equal(quantumSecurityPosture().quantumCurrency, false);
assert.equal(quantumSecurityPosture().quantumHardware, false);
console.log('quantum-research: PASS');
