const KEY = 'voxel-vault-ai-memory-v1';
const MAX_MESSAGES = 40;

export function loadAIMemory() {
  if (typeof window === 'undefined') return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string').slice(-MAX_MESSAGES)
      : [];
  } catch {
    return [];
  }
}

export function saveAIMemory(messages) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // Memory is an enhancement, never a dependency for the AI loop.
  }
}

export function clearAIMemory() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(KEY);
}
