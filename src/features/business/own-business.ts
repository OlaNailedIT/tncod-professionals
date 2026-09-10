import "server-only";

import type {
  BusinessProfessionalRelationship,
  BusinessStatus,
  VisibilityStatus,
  VerificationStatus,
} from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { rejectClientIdentity } from "@/server/auth/session";
import { writeAuditLog } from "@/server/audit/write-audit";
import { normalizePhone } from "@/features/registration/phone";
import {
  businessProfileSchema,
  businessVerificationSubmitSchema,
  emptySocialLinks,
  parseServicesOffered,
  parseSocialLinks,
  resolveIndustryId,
  servicesOfferedToForm,
  slugifyBusinessName,
  type SocialLinks,
} from "@/features/business/business-schema";
import {
  businessVerificationLabel,
  memberMaySubmit,
} from "@/features/business/verification-status";

export type MemberBusinessSummary = {
  id: string;
  name: string;
  industryName: string | null;
  businessStatus: BusinessStatus;
  verificationLabel: string;
  visibilityStatus: VisibilityStatus;
  relationshipType: BusinessProfessionalRelationship;
};

export type MemberBusinessDetail = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  industryId: string | null;
  industryName: string | null;
  socialLinks: SocialLinks;
  servicesOffered: string[];
  servicesOfferedForm: string;
  cacRegistered: boolean | null;
  cacNumber: string | null;
  clarificationMessage: string | null;
  businessStatus: BusinessStatus;
  verificationLabel: string;
  visibilityStatus: VisibilityStatus;
  relationshipType: BusinessProfessionalRelationship;
  createdAt: string;
  updatedAt: string;
};

async function requireOwnProfileId(authUserId: string): Promise<{ userId: string; profileId: string }> {
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: authUserId, deletedAt: null },
    include: { profile: { select: { id: true, deletedAt: true } } },
  });
  if (!user?.profile || user.profile.deletedAt) {
    throw new AppError("NOT_FOUND", "Profile not found");
  }
  return { userId: user.id, profileId: user.profile.id };
}

export async function assertBusinessAssociation(
  authUserId: string,
  businessId: string,
): Promise<{ profileId: string; relationshipType: BusinessProfessionalRelationship }> {
  const { profileId } = await requireOwnProfileId(authUserId);
  const prisma = getPrisma();
  const link = await prisma.businessProfessional.findUnique({
    where: {
      businessId_profileId: { businessId, profileId },
    },
  });
  if (!link) {
    throw new AppError("UNAUTHORIZED", "You are not associated with this business");
  }
  return { profileId, relationshipType: link.relationshipType };
}

export async function listOwnBusinesses(authUserId: string): Promise<MemberBusinessSummary[]> {
  const { profileId } = await requireOwnProfileId(authUserId);
  const prisma = getPrisma();
  const links = await prisma.businessProfessional.findMany({
    where: { profileId, business: { deletedAt: null } },
    include: {
      business: { include: { industry: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return links.map((link) => ({
    id: link.business.id,
    name: link.business.name,
    industryName: link.business.industry?.name ?? null,
    businessStatus: link.business.businessStatus,
    verificationLabel: businessVerificationLabel(link.business.businessStatus),
    visibilityStatus: link.business.visibilityStatus,
    relationshipType: link.relationshipType,
  }));
}

export async function loadOwnBusiness(
  authUserId: string,
  businessId: string,
): Promise<MemberBusinessDetail> {
  await assertBusinessAssociation(authUserId, businessId);
  const prisma = getPrisma();
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    include: {
      industry: { select: { name: true } },
      professionals: {
        where: {
          profile: { userId: authUserId },
        },
        take: 1,
      },
    },
  });
  if (!business || business.professionals.length === 0) {
    throw new AppError("NOT_FOUND", "Business not found");
  }
  const relationshipType = business.professionals[0]!.relationshipType;
  const socialLinks = parseSocialLinks(business.socialLinks);
  return {
    id: business.id,
    name: business.name,
    description: business.description,
    location: business.location,
    phone: business.phone,
    email: business.email,
    websiteUrl: business.websiteUrl,
    industryId: business.industryId,
    industryName: business.industry?.name ?? null,
    socialLinks,
    servicesOffered: business.servicesOffered,
    servicesOfferedForm: servicesOfferedToForm(business.servicesOffered),
    cacRegistered: business.cacRegistered,
    cacNumber: business.cacNumber,
    clarificationMessage: business.clarificationMessage,
    businessStatus: business.businessStatus,
    verificationLabel: businessVerificationLabel(business.businessStatus),
    visibilityStatus: business.visibilityStatus,
    relationshipType,
    createdAt: business.createdAt.toISOString(),
    updatedAt: business.updatedAt.toISOString(),
  };
}

export type BusinessMutationResult =
  | { ok: true; businessId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function claimedUserIdFrom(raw: unknown): string | undefined {
  if (raw && typeof raw === "object" && "claimedUserId" in raw) {
    const v = (raw as { claimedUserId?: unknown }).claimedUserId;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

export async function createOwnBusiness(
  authUserId: string,
  raw: unknown,
): Promise<BusinessMutationResult> {
  rejectClientIdentity(authUserId, claimedUserIdFrom(raw));
  const parsed = businessProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const { profileId } = await requireOwnProfileId(authUserId);
  const data = parsed.data;
  const industryId = resolveIndustryId(data.industryId);
  const prisma = getPrisma();

  if (industryId) {
    const industry = await prisma.industry.findFirst({
      where: { id: industryId, isActive: true },
      select: { id: true },
    });
    if (!industry) {
      return { ok: false, message: "Select a valid category.", fieldErrors: { industryId: ["Invalid category."] } };
    }
  }

  const baseSlug = slugifyBusinessName(data.name) || "business";
  let slug = baseSlug;
  for (let i = 0; i < 8; i++) {
    const clash = await prisma.business.findFirst({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    if (!clash) break;
    slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const phone = data.phone ? normalizePhone(data.phone) ?? data.phone.trim() : null;
  const socialLinks = parseSocialLinks(data.socialLinks);
  const servicesOffered = parseServicesOffered(data.servicesOffered);

  const created = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: data.name,
        slug,
        description: data.description ?? null,
        industryId,
        websiteUrl: data.websiteUrl ?? null,
        email: data.email ?? null,
        phone,
        location: data.location ?? null,
        socialLinks,
        servicesOffered,
        businessStatus: "DRAFT",
        visibilityStatus: "PRIVATE",
        cacRegistered: null,
        cacNumber: null,
        clarificationMessage: null,
      },
    });
    await tx.businessProfessional.create({
      data: {
        businessId: business.id,
        profileId,
        relationshipType: data.relationshipType,
      },
    });
    return business;
  });

  await writeAuditLog({
    actorId: authUserId,
    action: "business.create",
    entityType: "business",
    entityId: created.id,
    metadata: { relationshipType: data.relationshipType, businessStatus: "DRAFT" },
  });

  return { ok: true, businessId: created.id };
}

export async function updateOwnBusiness(
  authUserId: string,
  businessId: string,
  raw: unknown,
): Promise<BusinessMutationResult> {
  rejectClientIdentity(authUserId, claimedUserIdFrom(raw));
  if (
    raw &&
    typeof raw === "object" &&
    "claimedBusinessId" in raw &&
    (raw as { claimedBusinessId?: string }).claimedBusinessId &&
    (raw as { claimedBusinessId: string }).claimedBusinessId !== businessId
  ) {
    throw new AppError("UNAUTHORIZED", "Business identity mismatch");
  }

  await assertBusinessAssociation(authUserId, businessId);
  const parsed = businessProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;
  const industryId = resolveIndustryId(data.industryId);
  const prisma = getPrisma();

  if (industryId) {
    const industry = await prisma.industry.findFirst({
      where: { id: industryId, isActive: true },
      select: { id: true },
    });
    if (!industry) {
      return { ok: false, message: "Select a valid category.", fieldErrors: { industryId: ["Invalid category."] } };
    }
  }

  const existing = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });
  if (!existing) {
    throw new AppError("NOT_FOUND", "Business not found");
  }

  // Never accept client status / visibility.
  await prisma.business.update({
    where: { id: businessId },
    data: {
      name: data.name,
      description: data.description ?? null,
      industryId,
      websiteUrl: data.websiteUrl ?? null,
      email: data.email ?? null,
      phone: data.phone ? normalizePhone(data.phone) ?? data.phone.trim() : null,
      location: data.location ?? null,
      socialLinks: parseSocialLinks(data.socialLinks),
      servicesOffered: parseServicesOffered(data.servicesOffered),
    },
  });

  await writeAuditLog({
    actorId: authUserId,
    action: "business.update",
    entityType: "business",
    entityId: businessId,
    metadata: {
      previousStatus: existing.businessStatus,
      visibilityUnchanged: existing.visibilityStatus,
    },
  });

  return { ok: true, businessId };
}

export async function submitOwnBusinessVerification(
  authUserId: string,
  businessId: string,
  raw: unknown,
): Promise<BusinessMutationResult> {
  rejectClientIdentity(authUserId, claimedUserIdFrom(raw));
  await assertBusinessAssociation(authUserId, businessId);

  const parsed = businessVerificationSubmitSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the verification fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const prisma = getPrisma();
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
  });
  if (!business) {
    throw new AppError("NOT_FOUND", "Business not found");
  }
  if (!memberMaySubmit(business.businessStatus)) {
    return {
      ok: false,
      message: `Cannot submit while verification is “${businessVerificationLabel(business.businessStatus)}”.`,
    };
  }

  const cacRegistered =
    parsed.data.cacRegistered === "yes"
      ? true
      : parsed.data.cacRegistered === "no"
        ? false
        : null;
  const cacNumber = parsed.data.cacNumber ?? null;

  if (cacRegistered === true && !cacNumber) {
    return {
      ok: false,
      message: "CAC number is required when you indicate the business is CAC-registered.",
      fieldErrors: { cacNumber: ["CAC number is required."] },
    };
  }

  if (cacNumber) {
    const duplicate = await prisma.business.findFirst({
      where: {
        cacNumber,
        deletedAt: null,
        NOT: { id: businessId },
      },
      select: { id: true, name: true },
    });
    if (duplicate) {
      return {
        ok: false,
        message:
          "Another business already uses this CAC number. Contact EXCO if this is a legitimate shared registration.",
        fieldErrors: { cacNumber: ["CAC number already on file for another business."] },
      };
    }
  }

  const docs = await prisma.document.findMany({
    where: {
      businessId,
      documentType: { in: ["BUSINESS_REGISTRATION", "PROFESSIONAL_CERTIFICATE", "OTHER"] },
    },
    select: { id: true, documentType: true },
  });
  if (cacRegistered === true) {
    const hasCacDoc = docs.some((d) => d.documentType === "BUSINESS_REGISTRATION");
    if (!hasCacDoc) {
      return {
        ok: false,
        message: "Upload a CAC registration document before submitting.",
      };
    }
  }

  const previous = business.businessStatus;
  await prisma.business.update({
    where: { id: businessId },
    data: {
      cacRegistered,
      cacNumber,
      businessStatus: "SUBMITTED",
      // Clear member-facing clarification on resubmit; EXCO may set again.
      clarificationMessage: null,
    },
  });

  await writeAuditLog({
    actorId: authUserId,
    action: "business.verification.submit",
    entityType: "business",
    entityId: businessId,
    metadata: {
      previousStatus: previous,
      newStatus: "SUBMITTED",
      cacRegistered,
      // Do not store document bytes — ids only.
      documentIds: docs.map((d) => d.id),
    },
  });

  return { ok: true, businessId };
}

/** Side-effect probe: business verification must not mutate professional verification/visibility. */
export async function loadLinkedProfessionalStatuses(
  authUserId: string,
  businessId: string,
): Promise<{ verificationStatus: VerificationStatus; visibilityStatus: VisibilityStatus }[]> {
  await assertBusinessAssociation(authUserId, businessId);
  const prisma = getPrisma();
  const links = await prisma.businessProfessional.findMany({
    where: { businessId },
    include: {
      profile: { select: { verificationStatus: true, visibilityStatus: true } },
    },
  });
  return links.map((l) => ({
    verificationStatus: l.profile.verificationStatus,
    visibilityStatus: l.profile.visibilityStatus,
  }));
}

export { emptySocialLinks };
