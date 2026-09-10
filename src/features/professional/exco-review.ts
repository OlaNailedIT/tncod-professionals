import "server-only";

import type { Prisma, VerificationDecision, VerificationStatus, VisibilityStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { PERMISSIONS } from "@/security/permissions";
import { requirePermission, loadPermissionKeys } from "@/server/authorization/require";
import { hasPermission } from "@/security/authorization";
import { writeAuditLog } from "@/server/audit/write-audit";
import { assertExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import {
  allowedExcoProfessionalTransitions,
  professionalVerificationLabel,
  type ExcoProfessionalAction,
} from "@/features/professional/verification-status";
import { nextSlugCandidate, slugifyPublicName } from "@/features/professional/slug";
import { ensureIdentityPublicForPublish } from "@/features/visibility/own-preferences";

export type ExcoProfessionalDecisionResult =
  | { ok: true }
  | { ok: false; message: string };

async function mintUniquePublicSlug(
  tx: Prisma.TransactionClient,
  displayName: string,
  excludeProfileId: string,
): Promise<string> {
  const base = slugifyPublicName(displayName);
  for (let attempt = 1; attempt <= 50; attempt++) {
    const candidate = nextSlugCandidate(base, attempt);
    const existing = await tx.profile.findFirst({
      where: {
        publicSlug: candidate,
        deletedAt: null,
        NOT: { id: excludeProfileId },
      },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new AppError("INTERNAL", "Unable to mint unique public slug");
}

export async function applyExcoProfessionalDecision(input: {
  reviewerUserId: string;
  profileId: string;
  action: ExcoProfessionalAction;
  memberFacingMessage?: string;
  internalNote?: string;
}): Promise<ExcoProfessionalDecisionResult> {
  await assertExcoDashboardAccess(input.reviewerUserId);
  await requirePermission(input.reviewerUserId, PERMISSIONS.PROFESSIONAL_VERIFY);

  const prisma = getPrisma();
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, deletedAt: null },
    select: {
      id: true,
      verificationStatus: true,
      visibilityStatus: true,
      clarificationMessage: true,
      displayName: true,
    },
  });
  if (!profile) {
    throw new AppError("NOT_FOUND", "Professional not found");
  }

  const next = allowedExcoProfessionalTransitions(profile.verificationStatus, input.action);
  if (!next) {
    return {
      ok: false,
      message: `Action “${input.action}” is not allowed from ${professionalVerificationLabel(profile.verificationStatus)}.`,
    };
  }

  if (
    (input.action === "request_clarification" || input.action === "reject") &&
    !(input.memberFacingMessage?.trim())
  ) {
    return { ok: false, message: "A member-facing reason is required." };
  }

  const decision: VerificationDecision | null =
    input.action === "verify"
      ? "APPROVED"
      : input.action === "reject"
        ? "REJECTED"
        : input.action === "request_clarification"
          ? "NEEDS_CLARIFICATION"
          : null;

  const previous = profile.verificationStatus;
  // Blast radius: capture visibility — must not change on verify/clarify/reject
  const visibilityBefore = profile.visibilityStatus;

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: next,
        clarificationMessage:
          input.action === "request_clarification" || input.action === "reject"
            ? input.memberFacingMessage!.trim()
            : input.action === "verify"
              ? null
              : profile.clarificationMessage,
        visibilityStatus: visibilityBefore,
      },
    });

    if (decision) {
      await tx.verificationRecord.create({
        data: {
          profileId: profile.id,
          reviewerId: input.reviewerUserId,
          processStatus: "COMPLETED",
          decision,
          notes: input.memberFacingMessage?.trim() || null,
          completedAt: new Date(),
        },
      });
    } else if (input.action === "start_review") {
      await tx.verificationRecord.create({
        data: {
          profileId: profile.id,
          reviewerId: input.reviewerUserId,
          processStatus: "UNDER_REVIEW",
          decision: null,
          notes: null,
        },
      });
    }

    if (input.internalNote?.trim()) {
      await tx.adminNote.create({
        data: {
          profileId: profile.id,
          authorId: input.reviewerUserId,
          note: input.internalNote.trim(),
        },
      });
    }
  });

  const after = await prisma.profile.findFirst({
    where: { id: profile.id },
    select: { visibilityStatus: true, verificationStatus: true },
  });
  if (!after || after.visibilityStatus !== visibilityBefore) {
    throw new AppError("INTERNAL", "Visibility must not change during verification decisions");
  }

  await writeAuditLog({
    actorId: input.reviewerUserId,
    action: `professional.verification.${input.action}`,
    entityType: "profile",
    entityId: profile.id,
    metadata: {
      previousVerificationStatus: previous,
      newVerificationStatus: next,
      visibilityUnchanged: visibilityBefore,
      reason: input.memberFacingMessage?.trim() || null,
    },
  });

  return { ok: true };
}

export async function publishProfile(input: {
  actorUserId: string;
  profileId: string;
}): Promise<ExcoProfessionalDecisionResult> {
  await assertExcoDashboardAccess(input.actorUserId);
  await requirePermission(input.actorUserId, PERMISSIONS.PROFESSIONAL_PUBLISH);

  const prisma = getPrisma();
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, deletedAt: null },
    select: {
      id: true,
      displayName: true,
      verificationStatus: true,
      visibilityStatus: true,
      publicSlug: true,
    },
  });
  if (!profile) {
    throw new AppError("NOT_FOUND", "Professional not found");
  }

  if (profile.verificationStatus !== "VERIFIED") {
    return {
      ok: false,
      message: "Only VERIFIED professionals may be published to the directory.",
    };
  }

  if (profile.visibilityStatus === "DIRECTORY") {
    return { ok: true }; // idempotent
  }

  if (
    profile.visibilityStatus !== "PRIVATE" &&
    profile.visibilityStatus !== "MEMBERS_ONLY"
  ) {
    return { ok: false, message: "Invalid visibility state for publication." };
  }

  const previousVisibility = profile.visibilityStatus;

  // P14-21: directory-listed profiles must keep Identity preference Public.
  await ensureIdentityPublicForPublish(profile.id);

  await prisma.$transaction(async (tx) => {
    let slug = profile.publicSlug;
    if (!slug) {
      slug = await mintUniquePublicSlug(tx, profile.displayName, profile.id);
    }
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        visibilityStatus: "DIRECTORY",
        publicSlug: slug,
        verificationStatus: "VERIFIED", // must remain VERIFIED
      },
    });
    await tx.publication.create({
      data: {
        profileId: profile.id,
        status: "PUBLISHED",
        resultingVisibility: "DIRECTORY",
        actorId: input.actorUserId,
      },
    });
  });

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "professional.publish",
    entityType: "profile",
    entityId: profile.id,
    metadata: {
      previousVisibility,
      newVisibility: "DIRECTORY",
      verificationStatus: "VERIFIED",
    },
  });

  return { ok: true };
}

export async function unpublishProfile(input: {
  actorUserId: string;
  profileId: string;
}): Promise<ExcoProfessionalDecisionResult> {
  await assertExcoDashboardAccess(input.actorUserId);
  await requirePermission(input.actorUserId, PERMISSIONS.PROFESSIONAL_PUBLISH);

  const prisma = getPrisma();
  const profile = await prisma.profile.findFirst({
    where: { id: input.profileId, deletedAt: null },
    select: {
      id: true,
      verificationStatus: true,
      visibilityStatus: true,
      publicSlug: true,
    },
  });
  if (!profile) {
    throw new AppError("NOT_FOUND", "Professional not found");
  }

  if (profile.visibilityStatus !== "DIRECTORY") {
    return { ok: false, message: "Profile is not currently in the directory." };
  }

  const previousVerification = profile.verificationStatus;

  await prisma.$transaction(async (tx) => {
    await tx.profile.update({
      where: { id: profile.id },
      data: {
        visibilityStatus: "MEMBERS_ONLY",
        // Keep verificationStatus and publicSlug unchanged
        verificationStatus: profile.verificationStatus,
        publicSlug: profile.publicSlug,
      },
    });
    await tx.publication.create({
      data: {
        profileId: profile.id,
        status: "UNPUBLISHED",
        resultingVisibility: "MEMBERS_ONLY",
        actorId: input.actorUserId,
      },
    });
  });

  const after = await prisma.profile.findFirst({
    where: { id: profile.id },
    select: { verificationStatus: true, visibilityStatus: true, publicSlug: true },
  });
  if (
    !after ||
    after.verificationStatus !== previousVerification ||
    after.visibilityStatus !== "MEMBERS_ONLY" ||
    after.publicSlug !== profile.publicSlug
  ) {
    throw new AppError("INTERNAL", "Unpublish violated verification/slug invariants");
  }

  await writeAuditLog({
    actorId: input.actorUserId,
    action: "professional.unpublish",
    entityType: "profile",
    entityId: profile.id,
    metadata: {
      previousVisibility: "DIRECTORY",
      newVisibility: "MEMBERS_ONLY",
      verificationUnchanged: previousVerification,
      slugPreserved: Boolean(profile.publicSlug),
    },
  });

  return { ok: true };
}

export async function canMutateProfessionalVerification(userId: string): Promise<boolean> {
  const keys = await loadPermissionKeys(userId);
  return hasPermission(keys, PERMISSIONS.PROFESSIONAL_VERIFY);
}

export async function canPublishProfessionals(userId: string): Promise<boolean> {
  const keys = await loadPermissionKeys(userId);
  return hasPermission(keys, PERMISSIONS.PROFESSIONAL_PUBLISH);
}

export type ProfessionalVerificationHistoryItem = {
  id: string;
  processStatus: string;
  decision: string | null;
  notes: string | null;
  createdAt: Date;
  completedAt: Date | null;
  reviewerDisplayName: string | null;
};

export async function loadProfessionalVerificationHistory(
  actorUserId: string,
  profileId: string,
): Promise<ProfessionalVerificationHistoryItem[]> {
  await assertExcoDashboardAccess(actorUserId);
  const prisma = getPrisma();
  const rows = await prisma.verificationRecord.findMany({
    where: { profileId },
    orderBy: { createdAt: "asc" },
    include: {
      reviewer: {
        include: { profile: { select: { displayName: true } } },
      },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    processStatus: r.processStatus,
    decision: r.decision,
    notes: r.notes,
    createdAt: r.createdAt,
    completedAt: r.completedAt,
    reviewerDisplayName: r.reviewer.profile?.displayName ?? null,
  }));
}

export type { VerificationStatus, VisibilityStatus };
