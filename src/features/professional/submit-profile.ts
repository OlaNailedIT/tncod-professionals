import "server-only";

import type { VerificationStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { rejectClientIdentity } from "@/server/auth/session";
import { writeAuditLog } from "@/server/audit/write-audit";
import {
  calculateProfileCompletion,
  toCompletionInput,
  normalizeOpportunityPreferences,
} from "@/features/profile/completion";
import { memberMaySubmitVerification } from "@/features/professional/verification-status";

export type SubmitProfileResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Member submitProfile: completion 100% → profile_status SUBMITTED, verification PENDING.
 * Does not change visibility, roles, or business state.
 */
export async function submitProfile(authUserId: string): Promise<SubmitProfileResult> {
  const userId = rejectClientIdentity(authUserId);
  const prisma = getPrisma();

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, accountStatus: "ACTIVE" },
    include: {
      profile: {
        include: {
          professionalDetails: { include: { industry: { select: { name: true } } } },
          churchInformation: true,
          experiences: { select: { id: true }, take: 1 },
          profileSkills: { include: { skill: { select: { name: true } } } },
          profileServices: { include: { service: { select: { name: true } } } },
          businessLinks: {
            include: {
              business: {
                include: { industry: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.profile || user.profile.deletedAt) {
    throw new AppError("NOT_FOUND", "Profile not found");
  }

  const profile = user.profile;
  const pd = profile.professionalDetails;
  const completion = calculateProfileCompletion(
    toCompletionInput({
      displayName: profile.displayName,
      hasHeadshot: Boolean(profile.profileImageStorageKey),
      location: profile.location,
      bio: profile.bio,
      profession: pd?.profession ?? null,
      industryName: pd?.industry?.name ?? null,
      yearsExperience: pd?.yearsExperience ?? null,
      hasExperienceRows: profile.experiences.length > 0,
      skillNames: profile.profileSkills.map((s) => s.skill.name),
      serviceNames: profile.profileServices.map((s) => s.service.name),
      linkedinUrl: pd?.linkedinUrl ?? null,
      serviceArea: profile.churchInformation?.serviceArea ?? null,
      lookingForSummary: pd?.lookingForSummary ?? null,
      offeringSummary: pd?.offeringSummary ?? null,
      opportunityPreferences: normalizeOpportunityPreferences(pd?.opportunityPreferences),
      professionalSituation: profile.professionalSituation,
      businessLinks: profile.businessLinks.map((l) => ({
        name: l.business.name,
        industryName: l.business.industry?.name ?? null,
        description: l.business.description,
      })),
    }),
  );

  if (completion.percent !== 100) {
    return {
      ok: false,
      message: `Profile must be 100% complete before submission (currently ${completion.percent}%).`,
    };
  }

  if (!memberMaySubmitVerification(profile.verificationStatus)) {
    return {
      ok: false,
      message: `Cannot submit for verification from status ${profile.verificationStatus}.`,
    };
  }

  const previous = profile.verificationStatus as VerificationStatus;

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        profileStatus: "SUBMITTED",
        verificationStatus: "PENDING",
        // Clear member-facing clarification on resubmit; EXCO may set again.
        clarificationMessage: null,
      },
    });
  });

  await writeAuditLog({
    actorId: userId,
    action: "professional.verification.submit",
    entityType: "profile",
    entityId: profile.id,
    metadata: {
      previousVerificationStatus: previous,
      newVerificationStatus: "PENDING",
      profileStatus: "SUBMITTED",
      completionPercent: 100,
    },
  });

  return { ok: true };
}
