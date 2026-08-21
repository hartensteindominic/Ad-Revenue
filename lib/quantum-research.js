const ALGORITHMS = Object.freeze(['route-optimization', 'mission-scheduling', 'asset-search', 'entropy-experiment']);

export function createQuantumJob({ algorithm = 'route-optimization', input = {}, seed = 'voxel-vault' } = {}) {
  if (!ALGORITHMS.includes(algorithm)) throw new Error('Unsupported quantum research algorithm');
  return {
    id: `qjob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    algorithm,
    input,
    seed: String(seed),
    provider: 'simulation',
    status: 'simulated',
    createdAt: Date.now(),
    quantumHardwareUsed: false,
  };
}

export function simulateQuantumJob(job) {
  const text = JSON.stringify({ algorithm: job.algorithm, input: job.input, seed: job.seed });
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  const score = (hash >>> 0) / 0xffffffff;
  return { ...job, result: { score, deterministic: true }, completedAt: Date.now() };
}

export function listQuantumAlgorithms() {
  return [...ALGORITHMS];
}

export function quantumSecurityPosture() {
  return {
    status: 'research-ready',
    quantumCurrency: false,
    quantumHardware: false,
    postQuantumCryptography: 'planned',
    note: 'Do not market simulation output as quantum-computed or quantum-secure.'
  };
}
