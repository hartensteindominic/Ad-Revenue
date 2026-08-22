/**
 * Crestodian Mission Intelligence
 *
 * A deterministic orchestration boundary for Voxel Vault's autonomous developer
 * workflow. It describes goals, guardrails, and verification gates without
 * granting the application permission to spend money, sign transactions,
 * expose secrets, or deploy production by itself.
 */

export type MissionPriority = 'critical' | 'high' | 'normal' | 'explore';
export type MissionDomain =
  | 'ux'
  | '3d'
  | 'ai'
  | 'quantum'
  | 'commerce'
  | 'nft'
  | 'security'
  | 'performance'
  | 'growth';

export type Mission = {
  id: string;
  title: string;
  priority: MissionPriority;
  domains: MissionDomain[];
  objective: string;
  successSignals: string[];
  gates: Array<'typecheck' | 'build' | 'tests' | 'security' | 'visual' | 'human-review'>;
  forbidden: string[];
};

export const CRESTODIAN_PRIME_DIRECTIVE =
  'Make Voxel Vault feel futuristic and effortless while preserving truthful ownership, secure commerce, reversible engineering, and human control over irreversible actions.';

export const DEFAULT_GATES: Mission['gates'] = [
  'typecheck',
  'build',
  'tests',
  'security',
  'visual',
  'human-review',
];

export const DEFAULT_FORBIDDEN = [
  'expose secrets or private keys',
  'sign or broadcast blockchain transactions without explicit approval',
  'spend user or merchant funds without explicit approval',
  'deploy production without an explicit release decision',
  'claim quantum hardware access when only simulation is available',
  'treat client-submitted purchase evidence as a verified receipt',
];

export const MAX_VOXEL_VAULT_MISSION: Mission = {
  id: 'crestodian-max-001',
  title: 'Build the Voxel Vault intelligence frontier',
  priority: 'critical',
  domains: [
    'ux',
    '3d',
    'ai',
    'quantum',
    'commerce',
    'nft',
    'security',
    'performance',
    'growth',
  ],
  objective:
    'Turn real-world objects into trusted, beautiful digital twins with a premium mobile experience, intelligent assistance, scientific exploration, and production-grade provenance.',
  successSignals: [
    'A first-time visitor understands the physical-to-3D-to-NFT journey in seconds.',
    '3D previews remain useful on constrained mobile devices.',
    'AI explains objects, provenance, receipts, and collection context without inventing facts.',
    'Quantum features are scientifically honest and visually compelling.',
    'Commerce and minting remain server-verified and idempotent.',
    'Security checks run before every release candidate.',
    'Every risky autonomous action stops at a human approval gate.',
  ],
  gates: DEFAULT_GATES,
  forbidden: DEFAULT_FORBIDDEN,
};

export function createMissionId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `mission-${slug || 'untitled'}-${Date.now().toString(36)}`;
}

export function isMissionReleaseReady(input: {
  typecheck: boolean;
  build: boolean;
  tests: boolean;
  security: boolean;
  visual: boolean;
  humanReview: boolean;
}): boolean {
  return Object.values(input).every(Boolean);
}
