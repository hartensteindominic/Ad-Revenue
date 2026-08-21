export const MAX_EVENTS = 500;
export const MAX_CONVERSATION = 12;
export const MAX_TEXT = 1200;

const FORBIDDEN_ACTIONS = new Set([
  'transfer_funds',
  'grant_ownership',
  'deploy',
  'deploy_contract',
  'bypass_settlement',
  'override_wallet',
  'mint_unauthorized',
  'change_wallet_authorization',
]);

const PROMPT_INJECTION_MARKERS = [
  'ignore previous instructions',
  'ignore all previous instructions',
  'system message',
  'developer message',
  'reveal your prompt',
  'show your instructions',
  'bypass safety',
];

export function clampText(value: unknown, max = MAX_TEXT): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export function isPromptInjection(value: unknown): boolean {
  const text = clampText(value, 4000).toLowerCase();
  return PROMPT_INJECTION_MARKERS.some((marker) => text.includes(marker));
}

export function sanitizeConversation(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(-MAX_CONVERSATION)
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      role: item.role === 'user' ? 'user' : 'assistant',
      content: clampText(item.content),
    }))
    .filter((item) => item.content && !isPromptInjection(item.content));
}

export function sanitizeEvents(input: unknown) {
  if (!Array.isArray(input)) return [];
  return input.slice(-MAX_EVENTS).map((event: any) => ({
    type: clampText(event?.type, 80),
    timestamp: clampText(event?.timestamp, 80),
    wallet: clampText(event?.wallet, 120),
    dropId: clampText(event?.dropId, 120),
    tokenId: clampText(event?.tokenId, 120),
    valueEth: typeof event?.valueEth === 'number' && Number.isFinite(event.valueEth)
      ? Math.max(0, Math.min(event.valueEth, 1_000_000))
      : undefined,
    metadata: event?.metadata && typeof event.metadata === 'object' ? event.metadata : undefined,
  }));
}

export function validatePlan(plan: Array<{ action?: unknown }>) {
  return plan.map((item) => {
    const action = typeof item.action === 'string' ? item.action : '';
    if (FORBIDDEN_ACTIONS.has(action)) {
      return { ...item, action: 'blocked', autonomous: false, requiresHumanApproval: true };
    }
    return item;
  });
}

export function clampCycle(value: unknown, max: number): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(Math.max(Math.floor(parsed), 1), max);
}
