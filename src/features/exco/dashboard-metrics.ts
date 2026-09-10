import "server-only";

import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { loadRoleNames } from "@/server/authorization/require";
import { ROLES, type AppRoleName } from "@/security/permissions";
import { registrationWindowStartUtc } from "@/features/exco/metric-window";
import {
  computeExcoDashboardMetrics,
  type ExcoDashboardMetrics,
} from "@/features/exco/compute-dashboard-metrics";

export { registrationWindowStartUtc, computeExcoDashboardMetrics };
export type { ExcoDashboardMetrics };

const EXCO_DASHBOARD_ROLES: readonly AppRoleName[] = [
  ROLES.EXCO_VIEWER,
  ROLES.EXCO_ADMIN,
  ROLES.SUPER_ADMIN,
];

export async function hasExcoDashboardAccess(userId: string): Promise<boolean> {
  const roles = await loadRoleNames(userId);
  return roles.some((r) => EXCO_DASHBOARD_ROLES.includes(r));
}

export async function assertExcoDashboardAccess(userId: string): Promise<void> {
  if (!(await hasExcoDashboardAccess(userId))) {
    throw new AppError("UNAUTHORIZED", "EXCO access required");
  }
}

export async function loadExcoDashboardMetrics(actorUserId: string): Promise<ExcoDashboardMetrics> {
  await assertExcoDashboardAccess(actorUserId);
  return computeExcoDashboardMetrics(getPrisma());
}
