import "server-only";

import { getPrisma } from "@/lib/prisma/client";
import {
  assertExcoDashboardAccess,
} from "@/features/exco/dashboard-metrics";
import {
  computeExcoAnalytics,
  type ExcoAnalyticsSnapshot,
} from "@/features/exco/analytics/compute-analytics";
import type { AnalyticsQuery } from "@/features/exco/analytics/query";

export type { ExcoAnalyticsSnapshot };
export type { AnalyticsQuery };

export async function loadExcoAnalytics(
  actorUserId: string,
  filters: AnalyticsQuery,
): Promise<ExcoAnalyticsSnapshot> {
  await assertExcoDashboardAccess(actorUserId);
  return computeExcoAnalytics(getPrisma(), filters);
}
