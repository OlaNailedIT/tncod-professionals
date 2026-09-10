"use server";

import { requireAuthenticatedUser } from "@/server/auth/session";
import { findPotentialMatches } from "@/features/matching/commands";

/** Server action — EXCO only; forged identity/professional IDs ignored. */
export async function findPotentialMatchesAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  return findPotentialMatches({
    actorUserId: user.userId,
    opportunityId: String(body.opportunityId ?? ""),
    professionalId: body.professionalId,
    profileId: body.profileId,
    userId: body.userId,
    role: body.role,
  });
}
