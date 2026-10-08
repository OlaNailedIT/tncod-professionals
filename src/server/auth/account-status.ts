import "server-only";

import type { AccountStatus } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { getPrisma } from "@/lib/prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requireRole } from "@/server/authorization/require";

const LONG_BAN = "876000h";

/**
 * Canonical account-status workflow. The Auth ban changes first, so a failed
 * deactivation never leaves a newly refreshed session with application access.
 * The active-identity guard blocks already-issued access tokens immediately.
 */
export async function setAccountStatus(
  actorUserId: string,
  targetUserId: string,
  nextStatus: AccountStatus,
): Promise<void> {
  await requireRole(actorUserId, "SUPER_ADMIN");

  const prisma = getPrisma();
  const current = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { accountStatus: true },
  });
  if (!current) throw new AppError("NOT_FOUND", "User not found");
  if (current.accountStatus === nextStatus) return;

  const admin = createServiceRoleClient();
  const nextBan = nextStatus === "ACTIVE" ? "none" : LONG_BAN;
  const rollbackBan = current.accountStatus === "ACTIVE" ? "none" : LONG_BAN;
  const { error: authError } = await admin.auth.admin.updateUserById(targetUserId, {
    ban_duration: nextBan,
  });
  if (authError) {
    throw new AppError("INTERNAL", "Could not synchronize account access");
  }

  try {
    await prisma.user.update({
      where: { id: targetUserId },
      data: { accountStatus: nextStatus },
    });
  } catch (error) {
    await admin.auth.admin.updateUserById(targetUserId, { ban_duration: rollbackBan });
    throw error;
  }
}
