"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { submitProfile } from "@/features/professional/submit-profile";
import {
  applyExcoProfessionalDecision,
  publishProfile,
  unpublishProfile,
} from "@/features/professional/exco-review";
import type { ExcoProfessionalAction } from "@/features/professional/verification-status";

function revalidateProfessionalPaths(profileId?: string) {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/exco");
  revalidatePath("/exco/verification");
  revalidatePath("/exco/professionals");
  if (profileId) {
    revalidatePath(`/exco/professionals/${profileId}`);
  }
}

export async function submitProfileAction() {
  const user = await requireAuthenticatedUser();
  const result = await submitProfile(user.userId);
  if (result.ok) {
    revalidateProfessionalPaths();
  }
  return result;
}

export async function excoProfessionalDecisionAction(input: {
  profileId: string;
  action: ExcoProfessionalAction;
  memberFacingMessage?: string;
  internalNote?: string;
}) {
  const user = await requireAuthenticatedUser();
  const result = await applyExcoProfessionalDecision({
    reviewerUserId: user.userId,
    profileId: input.profileId,
    action: input.action,
    memberFacingMessage: input.memberFacingMessage,
    internalNote: input.internalNote,
  });
  if (result.ok) {
    revalidateProfessionalPaths(input.profileId);
    revalidatePath("/exco/verification");
  }
  return result;
}

export async function publishProfileAction(profileId: string) {
  const user = await requireAuthenticatedUser();
  const result = await publishProfile({ actorUserId: user.userId, profileId });
  if (result.ok) {
    revalidateProfessionalPaths(profileId);
  }
  return result;
}

export async function unpublishProfileAction(profileId: string) {
  const user = await requireAuthenticatedUser();
  const result = await unpublishProfile({ actorUserId: user.userId, profileId });
  if (result.ok) {
    revalidateProfessionalPaths(profileId);
  }
  return result;
}
