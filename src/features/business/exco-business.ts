import "server-only";

import type { BusinessStatus, VerificationDecision } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { requirePermission } from "@/server/authorization/require";
import { PERMISSIONS } from "@/security/permissions";
import { writeAuditLog } from "@/server/audit/write-audit";
import { parseSocialLinks } from "@/features/business/business-schema";
import {
  allowedExcoTransitions,
  businessVerificationLabel,
  type ExcoBusinessAction,
} from "@/features/business/verification-status";
import { listBusinessDocumentsForExco } from "@/features/business/business-documents";
import { assertExcoDashboardAccess } from "@/features/exco/dashboard-metrics";

export type ExcoBusinessListItem = {
  id: string;
  name: string;
  businessStatus: BusinessStatus;
  verificationLabel: string;
  industryName: string | null;
  updatedAt: string;
  associationCount: number;
};

export async function listExcoBusinesses(reviewerUserId: string): Promise<ExcoBusinessListItem[]> {
  await assertExcoDashboardAccess(reviewerUserId);
  await requirePermission(reviewerUserId, PERMISSIONS.BUSINESS_VIEW);
  const prisma = getPrisma();
  const rows = await prisma.business.findMany({
    where: {
      deletedAt: null,
      businessStatus: {
        in: ["SUBMITTED", "PENDING_REVIEW", "APPROVED", "NEEDS_CLARIFICATION", "REJECTED", "SUSPENDED"],
      },
    },
    include: {
      industry: { select: { name: true } },
      _count: { select: { professionals: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map((b) => ({
    id: b.id,
    name: b.name,
    businessStatus: b.businessStatus,
    verificationLabel: businessVerificationLabel(b.businessStatus),
    industryName: b.industry?.name ?? null,
    updatedAt: b.updatedAt.toISOString(),
    associationCount: b._count.professionals,
  }));
}

export async function loadExcoBusiness(reviewerUserId: string, businessId: string) {
  await assertExcoDashboardAccess(reviewerUserId);
  await requirePermission(reviewerUserId, PERMISSIONS.BUSINESS_VIEW);
  const prisma = getPrisma();
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    include: {
      industry: { select: { name: true } },
      professionals: {
        include: {
          profile: {
            select: {
              id: true,
              displayName: true,
              verificationStatus: true,
              visibilityStatus: true,
              user: { select: { email: true } },
            },
          },
        },
      },
      verificationRecords: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });
  if (!business) {
    throw new AppError("NOT_FOUND", "Business not found");
  }

  const documents = await listBusinessDocumentsForExco(reviewerUserId, businessId);

  return {
    id: business.id,
    name: business.name,
    description: business.description,
    location: business.location,
    phone: business.phone,
    email: business.email,
    websiteUrl: business.websiteUrl,
    industryName: business.industry?.name ?? null,
    socialLinks: parseSocialLinks(business.socialLinks),
    servicesOffered: business.servicesOffered,
    cacRegistered: business.cacRegistered,
    cacNumber: business.cacNumber,
    clarificationMessage: business.clarificationMessage,
    businessStatus: business.businessStatus,
    verificationLabel: businessVerificationLabel(business.businessStatus),
    visibilityStatus: business.visibilityStatus,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
    professionals: business.professionals.map((p) => ({
      profileId: p.profileId,
      displayName: p.profile.displayName,
      email: p.profile.user.email,
      relationshipType: p.relationshipType,
      professionalVerificationStatus: p.profile.verificationStatus,
      professionalVisibilityStatus: p.profile.visibilityStatus,
    })),
    documents,
    verificationHistory: business.verificationRecords.map((r) => ({
      id: r.id,
      processStatus: r.processStatus,
      decision: r.decision,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      completedAt: r.completedAt?.toISOString() ?? null,
    })),
  };
}

export type ExcoDecisionResult =
  | { ok: true }
  | { ok: false; message: string };

export async function applyExcoBusinessDecision(input: {
  reviewerUserId: string;
  businessId: string;
  action: ExcoBusinessAction;
  memberFacingMessage?: string;
  internalNote?: string;
}): Promise<ExcoDecisionResult> {
  await assertExcoDashboardAccess(input.reviewerUserId);
  await requirePermission(input.reviewerUserId, PERMISSIONS.BUSINESS_VERIFY);

  const prisma = getPrisma();
  const business = await prisma.business.findFirst({
    where: { id: input.businessId, deletedAt: null },
    include: {
      professionals: {
        include: {
          profile: {
            select: { id: true, verificationStatus: true, visibilityStatus: true },
          },
        },
      },
    },
  });
  if (!business) {
    throw new AppError("NOT_FOUND", "Business not found");
  }

  const next = allowedExcoTransitions(business.businessStatus, input.action);
  if (!next) {
    return {
      ok: false,
      message: `Action “${input.action}” is not allowed from ${businessVerificationLabel(business.businessStatus)}.`,
    };
  }

  if (
    (input.action === "request_clarification" || input.action === "reject") &&
    !(input.memberFacingMessage?.trim())
  ) {
    return { ok: false, message: "A member-facing reason is required." };
  }

  const decision: VerificationDecision | null =
    input.action === "approve"
      ? "APPROVED"
      : input.action === "reject"
        ? "REJECTED"
        : input.action === "request_clarification"
          ? "NEEDS_CLARIFICATION"
          : null;

  const previousProfessionalStates = business.professionals.map((p) => ({
    profileId: p.profileId,
    verificationStatus: p.profile.verificationStatus,
    visibilityStatus: p.profile.visibilityStatus,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.business.update({
      where: { id: input.businessId },
      data: {
        businessStatus: next,
        clarificationMessage:
          input.action === "request_clarification" || input.action === "reject"
            ? input.memberFacingMessage!.trim()
            : input.action === "approve"
              ? null
              : business.clarificationMessage,
        // Never auto-publish.
        visibilityStatus: business.visibilityStatus,
      },
    });

    if (decision) {
      await tx.verificationRecord.create({
        data: {
          businessId: input.businessId,
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
          businessId: input.businessId,
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
          businessId: input.businessId,
          authorId: input.reviewerUserId,
          note: input.internalNote.trim(),
        },
      });
    }
  });

  // Invariant: professional verification/visibility unchanged.
  const after = await prisma.businessProfessional.findMany({
    where: { businessId: input.businessId },
    include: {
      profile: { select: { id: true, verificationStatus: true, visibilityStatus: true } },
    },
  });
  for (const prev of previousProfessionalStates) {
    const now = after.find((a) => a.profileId === prev.profileId);
    if (
      !now ||
      now.profile.verificationStatus !== prev.verificationStatus ||
      now.profile.visibilityStatus !== prev.visibilityStatus
    ) {
      throw new AppError("INTERNAL", "Business verification mutated professional status");
    }
  }

  await writeAuditLog({
    actorId: input.reviewerUserId,
    action: `business.verification.${input.action}`,
    entityType: "business",
    entityId: input.businessId,
    metadata: {
      previousStatus: business.businessStatus,
      newStatus: next,
      hasMemberMessage: Boolean(input.memberFacingMessage?.trim()),
      hasInternalNote: Boolean(input.internalNote?.trim()),
    },
  });

  return { ok: true };
}
