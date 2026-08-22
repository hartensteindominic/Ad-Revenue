/**
 * Voxel Vault Bounded AI Agency
 *
 * Principle: The assistant may reason, research, organize, simulate, and
 * propose changes — but it cannot independently spend money, transfer
 * ownership, publish a sale, expose secrets, sign a blockchain transaction,
 * or rewrite production code without explicit human approval.
 *
 * All code-related actions are proposal-only and fully monitored.
 */

export type AgencyLevel = 'observe' | 'suggest' | 'act';

export type AIAction =
  | 'research'
  | 'organize_room'
  | 'draft_listing'
  | 'prepare_mint'
  | 'prepare_transfer'
  | 'run_quantum_simulation'
  | 'propose_code_change'
  | 'explain_object'
  | 'plan_collection';

export type Decision = {
  action: AIAction;
  level: AgencyLevel;
  reason: string;
  requiresApproval: boolean;
  reversible: boolean;
  monitored: boolean;
};

/** Actions the assistant may perform automatically when the user has asked. */
const SAFE_AUTO = new Set<AIAction>([
  'research',
  'organize_room',
  'run_quantum_simulation',
  'explain_object',
  'plan_collection',
]);

/** Actions that always require explicit human approval. */
const APPROVAL = new Set<AIAction>([
  'draft_listing',
  'prepare_mint',
  'prepare_transfer',
  'propose_code_change',
]);

/** Actions that can be undone or discarded without permanent side-effects. */
const REVERSIBLE = new Set<AIAction>([
  'research',
  'organize_room',
  'draft_listing',
  'run_quantum_simulation',
  'propose_code_change',
  'explain_object',
  'plan_collection',
]);

/** Every AI decision is logged / monitored. */
const ALWAYS_MONITORED = true;

export function decide(
  action: AIAction,
  requested: AgencyLevel = 'suggest'
): Decision {
  const safe = SAFE_AUTO.has(action);
  const requiresApproval = APPROVAL.has(action) || requested !== 'act';

  return {
    action,
    level: safe && requested === 'act' ? 'act' : requested,
    reason: safe
      ? 'Low-risk informational or reversible action.'
      : 'This action can affect money, ownership, listings, blockchain state, or production code. Human approval required.',
    requiresApproval,
    reversible: REVERSIBLE.has(action),
    monitored: ALWAYS_MONITORED,
  };
}

export const AGENCY_PRINCIPLE =
  'The assistant may choose how to pursue a user-approved goal, but it cannot independently spend money, transfer ownership, publish a sale, expose secrets, sign a blockchain transaction, or rewrite production code. All code changes are proposals only and remain under human monitoring.';

export type CodeProposal = {
  id: string;
  title: string;
  summary: string;
  files: Array<{ path: string; description: string; diffPreview?: string }>;
  risk: 'low' | 'medium' | 'high';
  status: 'proposed' | 'approved' | 'rejected' | 'applied';
  createdAt: string;
  requiresHumanMerge: true;
};

/**
 * Create a monitored code proposal. Never applies changes.
 * The proposal must be reviewed and merged by a human.
 */
export function createCodeProposal(input: {
  title: string;
  summary: string;
  files: Array<{ path: string; description: string; diffPreview?: string }>;
  risk?: 'low' | 'medium' | 'high';
}): CodeProposal {
  return {
    id: `prop_${Date.now().toString(36)}`,
    title: input.title,
    summary: input.summary,
    files: input.files,
    risk: input.risk || 'medium',
    status: 'proposed',
    createdAt: new Date().toISOString(),
    requiresHumanMerge: true,
  };
}
