"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/server/auth/session";
import {
  closeOpportunity,
  createOpportunity,
  expressInterest,
  removeInterest,
} from "@/features/opportunities/commands";

export async function createOpportunityAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const result = await createOpportunity({ actorUserId: user.userId, raw });
  if (result.ok) {
    revalidatePath("/opportunities");
  }
  return result;
}

export async function closeOpportunityAction(opportunityId: string) {
  const user = await requireAuthenticatedUser();
  const result = await closeOpportunity({
    actorUserId: user.userId,
    opportunityId,
  });
  if (result.ok) {
    revalidatePath("/opportunities");
    revalidatePath(`/opportunities/${opportunityId}`);
  }
  return result;
}

export async function expressInterestAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const result = await expressInterest({
    actorUserId: user.userId,
    opportunityId: String(body.opportunityId ?? ""),
    profileId: body.profileId,
    userId: body.userId,
    memberId: body.memberId,
  });
  if (result.ok) {
    revalidatePath("/opportunities");
    if (typeof body.opportunityId === "string") {
      revalidatePath(`/opportunities/${body.opportunityId}`);
    }
  }
  return result;
}

export async function removeInterestAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const result = await removeInterest({
    actorUserId: user.userId,
    opportunityId: String(body.opportunityId ?? ""),
    profileId: body.profileId,
    userId: body.userId,
  });
  if (result.ok) {
    revalidatePath("/opportunities");
    if (typeof body.opportunityId === "string") {
      revalidatePath(`/opportunities/${body.opportunityId}`);
    }
  }
  return result;
}
