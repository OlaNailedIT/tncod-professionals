/** Pure Phase 10 metric helpers — safe for unit tests (no server-only). */

/** UTC calendar day start for “today”, then subtract (days - 1) for inclusive window. */
export function registrationWindowStartUtc(now: Date, inclusiveDays: number): Date {
  const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = new Date(utcMidnight);
  start.setUTCDate(start.getUTCDate() - (inclusiveDays - 1));
  return start;
}
