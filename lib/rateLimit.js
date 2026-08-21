const buckets = new Map();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const MAX_KEYS = 5_000;

export function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 64) || 'unknown';
  return (request.headers.get('x-real-ip') || 'unknown').slice(0, 64);
}

export function rateLimit(key, limit = MAX_REQUESTS) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    const entry = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, entry);
    prune(now);
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: entry.resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

function prune(now) {
  if (buckets.size <= MAX_KEYS) return;
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) buckets.delete(key);
    if (buckets.size <= MAX_KEYS) break;
  }
}

export function rateLimitHeaders(result) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
    'Cache-Control': 'no-store',
  };
}
