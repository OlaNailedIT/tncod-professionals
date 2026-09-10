/**
 * In-process rate limit for registration (MVP).
 * Server-side only — not a substitute for edge/WAF limits in production.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSec: number };

export function checkRegistrationRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (existing.count >= MAX_ATTEMPTS) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }
  existing.count += 1;
  return { ok: true };
}

/** Test helper — clears buckets between unit tests. */
export function resetRegistrationRateLimitForTests(): void {
  buckets.clear();
}
