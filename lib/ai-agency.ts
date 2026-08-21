export type AgencyLevel='observe'|'suggest'|'act';
export type AIAction='research'|'organize_room'|'draft_listing'|'prepare_mint'|'prepare_transfer'|'run_quantum_simulation';
export type Decision={action:AIAction;level:AgencyLevel;reason:string;requiresApproval:boolean;reversible:boolean};
const SAFE_AUTO=new Set<AIAction>(['research','organize_room','run_quantum_simulation']);
const APPROVAL=new Set<AIAction>(['draft_listing','prepare_mint','prepare_transfer']);
export function decide(action:AIAction,requested:AgencyLevel='suggest'):Decision{
 const safe=SAFE_AUTO.has(action);const requiresApproval=APPROVAL.has(action)||requested!=='act';
 return {action,level:safe&&requested==='act'?'act':requested,reason:safe?'Low-risk informational or reversible action.':'This action can affect money, ownership, listings, or blockchain state.',requiresApproval};
}
export const AGENCY_PRINCIPLE='The assistant may choose how to pursue a user-approved goal, but it cannot independently spend money, transfer ownership, publish a sale, expose secrets, or sign a blockchain transaction.';
