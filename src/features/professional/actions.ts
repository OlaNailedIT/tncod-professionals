"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { submitProfile } from "@/features/professional/submit-profile";
import type { SubmitProfileResult } from "@/features/professional/submit-profile";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
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

export async function submitProfileAction(
  _previousState: SubmitProfileResult | null = null,
): Promise<SubmitProfileResult> {
  // Previous form state is presentation only. Identity and eligibility always
  // come from the authenticated session and the existing server command.
  let result: SubmitProfileResult;
  try {
    const user = await requireAuthenticatedUser();
    result = await submitProfile(user.userId);
    if (result.ok) revalidateProfessionalPaths();
  } catch (error) {
    if (!(error instanceof AppError && error.code === "UNAUTHENTICATED")) {
      logger.error("professional_submission_failed", { code: error instanceof AppError ? error.code : "INTERNAL" });
    }
    return {
      ok: false,
      message: error instanceof AppError && error.code === "UNAUTHENTICATED"
        ? "Your session has ended. Refresh the page to sign in again."
        : "Your submission could not be confirmed. Refresh your profile to check its status before trying again.",
    };
  }
  // Native HTML submissions need POST/redirect/GET so Refresh cannot resend
  // the command. Enhanced action requests keep their inline action state.
  // Redirect throws a framework control signal; keep it outside the catch.
  if (result.ok && (await headers()).get("accept")?.includes("text/html")) {
    redirect("/profile");
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
