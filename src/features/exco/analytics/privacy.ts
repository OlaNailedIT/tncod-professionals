/**
 * Phase 20 — small-count privacy for composition breakdowns.
 * Threshold LOCKED at n < 3 → bucket as "(suppressed)".
 */

export const ANALYTICS_SUPPRESSION_THRESHOLD = 3;

export type BreakdownRow = {
  key: string;
  count: number;
};

export type PrivacyBreakdownRow = {
  key: string;
  count: number;
  suppressed: boolean;
};

/**
 * Merge groups with count < threshold into a single `(suppressed)` bucket.
 * Keys with count >= threshold pass through unchanged.
 * Does not reveal suppressed group keys.
 */
export function suppressBreakdown(
  rows: BreakdownRow[],
  threshold: number = ANALYTICS_SUPPRESSION_THRESHOLD,
): PrivacyBreakdownRow[] {
  const visible: PrivacyBreakdownRow[] = [];
  let suppressedSum = 0;
  for (const row of rows) {
    if (row.count <= 0) continue;
    if (row.count < threshold) {
      suppressedSum += row.count;
    } else {
      visible.push({ key: row.key, count: row.count, suppressed: false });
    }
  }
  visible.sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
  if (suppressedSum > 0) {
    visible.push({
      key: "(suppressed)",
      count: suppressedSum,
      suppressed: true,
    });
  }
  return visible;
}
