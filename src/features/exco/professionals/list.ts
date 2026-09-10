import "server-only";

import type { Prisma, VerificationStatus, VisibilityStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { loadRoleNames } from "@/server/authorization/require";
import { assertExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "@/features/profile/completion";
import {
  EXCO_PROFESSIONALS_PAGE_SIZE,
  canViewExcoContactFields,
  type ExcoProfessionalsQuery,
  type ExcoProfessionalsSort,
} from "@/features/exco/professionals/query";
import {
  presentVerificationStatus,
  presentVisibilityStatus,
} from "@/lib/status/presentations";

export { canViewExcoContactFields };

const VERIFICATION_ORDER: VerificationStatus[] = [
  "NOT_REVIEWED",
  "PENDING",
  "UNDER_REVIEW",
  "NEEDS_CLARIFICATION",
  "VERIFIED",
  "REJECTED",
];

function prismaOrderBy(sort: ExcoProfessionalsSort): Prisma.ProfileOrderByWithRelationInput[] {
  switch (sort) {
    case "display_name_desc":
      return [{ displayName: "desc" }];
    case "created_at_asc":
      return [{ user: { createdAt: "asc" } }];
    case "created_at_desc":
      return [{ user: { createdAt: "desc" } }];
    case "updated_at_asc":
      return [{ updatedAt: "asc" }];
    case "updated_at_desc":
      return [{ updatedAt: "desc" }];
    case "verification_status_asc":
      return [{ verificationStatus: "asc" }, { displayName: "asc" }];
    case "verification_status_desc":
      return [{ verificationStatus: "desc" }, { displayName: "asc" }];
    case "display_name_asc":
    default:
      return [{ displayName: "asc" }];
  }
}

function buildWhere(
  query: ExcoProfessionalsQuery,
  canSearchEmail: boolean,
): Prisma.ProfileWhereInput {
  const and: Prisma.ProfileWhereInput[] = [{ deletedAt: null }];

  if (query.verificationStatus) {
    and.push({ verificationStatus: query.verificationStatus as VerificationStatus });
  }
  if (query.verifiedProfessional) {
    and.push({ verificationStatus: "VERIFIED" });
  }
  if (query.visibilityStatus) {
    and.push({ visibilityStatus: query.visibilityStatus as VisibilityStatus });
  }
  if (query.jobSeeker) {
    and.push({ professionalSituation: "Job seeker" });
  }
  if (query.location) {
    and.push({ location: { contains: query.location, mode: "insensitive" } });
  }
  if (query.profession) {
    and.push({
      professionalDetails: {
        is: { profession: { contains: query.profession, mode: "insensitive" } },
      },
    });
  }
  if (query.industryId && query.industryId !== "none") {
    and.push({
      professionalDetails: { is: { industryId: query.industryId } },
    });
  }
  if (query.businessOwner) {
    and.push({
      businessLinks: {
        some: {
          relationshipType: "OWNER",
          business: { is: { deletedAt: null } },
        },
      },
    });
  }
  if (query.q) {
    const q = query.q;
    const or: Prisma.ProfileWhereInput[] = [
      { displayName: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { professionalDetails: { is: { profession: { contains: q, mode: "insensitive" } } } },
    ];
    if (canSearchEmail) {
      or.push({ user: { is: { email: { contains: q, mode: "insensitive" }, deletedAt: null } } });
    }
    and.push({ OR: or });
  }

  return { AND: and };
}

export type ExcoProfessionalListItem = {
  id: string;
  displayName: string;
  profession: string | null;
  industryName: string | null;
  location: string | null;
  completionPercent: number;
  verificationStatus: VerificationStatus;
  verificationLabel: string;
  visibilityStatus: VisibilityStatus;
  visibilityLabel: string;
  isJobSeeker: boolean;
  isBusinessOwner: boolean;
  email: string | null;
};

export type ExcoProfessionalsListResult = {
  items: ExcoProfessionalListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

type ProfileRow = Awaited<ReturnType<typeof loadCandidateProfiles>>[number];

async function loadCandidateProfiles(where: Prisma.ProfileWhereInput, sort: ExcoProfessionalsSort) {
  const prisma = getPrisma();
  return prisma.profile.findMany({
    where,
    orderBy: prismaOrderBy(sort),
    include: {
      user: { select: { email: true, createdAt: true, deletedAt: true } },
      professionalDetails: { include: { industry: { select: { name: true } } } },
      churchInformation: { select: { serviceArea: true } },
      experiences: { select: { id: true }, take: 1 },
      profileSkills: { include: { skill: { select: { name: true } } } },
      profileServices: { include: { service: { select: { name: true } } } },
      businessLinks: {
        include: {
          business: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
              description: true,
              industry: { select: { name: true } },
            },
          },
        },
      },
    },
  });
}

function completionForProfile(profile: ProfileRow): number {
  const details = profile.professionalDetails;
  const businessLinks = profile.businessLinks
    .filter((link) => !link.business.deletedAt)
    .map((link) => ({
      name: link.business.name,
      industryName: link.business.industry?.name ?? null,
      description: link.business.description,
    }));
  return calculateProfileCompletion(
    toCompletionInput({
      displayName: profile.displayName,
      location: profile.location,
      bio: profile.bio,
      hasHeadshot: Boolean(profile.profileImageStorageKey),
      profession: details?.profession ?? null,
      industryName: details?.industry?.name ?? null,
      yearsExperience: details?.yearsExperience ?? null,
      hasExperienceRows: profile.experiences.length > 0,
      skillNames: profile.profileSkills.map((ps) => ps.skill.name),
      serviceNames: profile.profileServices.map((ps) => ps.service.name),
      linkedinUrl: details?.linkedinUrl ?? null,
      serviceArea: profile.churchInformation?.serviceArea ?? null,
      lookingForSummary: details?.lookingForSummary ?? null,
      offeringSummary: details?.offeringSummary ?? null,
      opportunityPreferences: normalizeOpportunityPreferences(details?.opportunityPreferences),
      professionalSituation: profile.professionalSituation,
      businessLinks,
    }),
  ).percent;
}

function toListItem(
  profile: ProfileRow,
  completionPercent: number,
  includeEmail: boolean,
): ExcoProfessionalListItem {
  const isBusinessOwner = profile.businessLinks.some(
    (l) => l.relationshipType === "OWNER" && !l.business.deletedAt,
  );
  return {
    id: profile.id,
    displayName: profile.displayName,
    profession: profile.professionalDetails?.profession ?? null,
    industryName: profile.professionalDetails?.industry?.name ?? null,
    location: profile.location,
    completionPercent,
    verificationStatus: profile.verificationStatus,
    verificationLabel: presentVerificationStatus(profile.verificationStatus).label,
    visibilityStatus: profile.visibilityStatus,
    visibilityLabel: presentVisibilityStatus(profile.visibilityStatus).label,
    isJobSeeker: profile.professionalSituation === "Job seeker",
    isBusinessOwner,
    email: includeEmail ? profile.user.email : null,
  };
}

export async function listExcoProfessionals(
  actorUserId: string,
  query: ExcoProfessionalsQuery,
): Promise<ExcoProfessionalsListResult> {
  await assertExcoDashboardAccess(actorUserId);
  const roles = await loadRoleNames(actorUserId);
  const includeEmail = canViewExcoContactFields(roles);
  const where = buildWhere(query, includeEmail);

  const candidates = await loadCandidateProfiles(where, query.sort);

  const scored = candidates.map((profile) => {
    const percent = completionForProfile(profile);
    return { profile, percent };
  });

  let filtered = scored;
  if (query.completion === "complete") {
    filtered = scored.filter((s) => s.percent === 100);
  } else if (query.completion === "incomplete") {
    filtered = scored.filter((s) => s.percent < 100);
  }

  // Stable secondary sort for verification enum when DB order is lexical.
  if (query.sort.startsWith("verification_status")) {
    const dir = query.sort.endsWith("desc") ? -1 : 1;
    filtered = [...filtered].sort((a, b) => {
      const ai = VERIFICATION_ORDER.indexOf(a.profile.verificationStatus);
      const bi = VERIFICATION_ORDER.indexOf(b.profile.verificationStatus);
      if (ai !== bi) return (ai - bi) * dir;
      return a.profile.displayName.localeCompare(b.profile.displayName);
    });
  }

  const total = filtered.length;
  const pageSize = EXCO_PROFESSIONALS_PAGE_SIZE;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * pageSize;
  const slice = filtered.slice(start, start + pageSize);

  return {
    items: slice.map(({ profile, percent }) => toListItem(profile, percent, includeEmail)),
    total,
    page,
    pageSize,
    pageCount,
  };
}

export async function listActiveIndustriesForExco(): Promise<Array<{ id: string; name: string }>> {
  const prisma = getPrisma();
  return prisma.industry.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function loadExcoProfessional(
  actorUserId: string,
  profileId: string,
): Promise<ExcoProfessionalDetail> {
  await assertExcoDashboardAccess(actorUserId);
  const roles = await loadRoleNames(actorUserId);
  const includeContact = canViewExcoContactFields(roles);

  const prisma = getPrisma();
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, deletedAt: null },
    include: {
      user: { select: { email: true, phone: true, createdAt: true } },
      professionalDetails: { include: { industry: { select: { id: true, name: true } } } },
      churchInformation: { select: { serviceArea: true } },
      experiences: { select: { id: true, role: true, organisation: true }, take: 20 },
      profileSkills: { include: { skill: { select: { name: true } } } },
      profileServices: { include: { service: { select: { name: true } } } },
      businessLinks: {
        include: {
          business: {
            select: {
              id: true,
              name: true,
              deletedAt: true,
              description: true,
              businessStatus: true,
              visibilityStatus: true,
              industry: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!profile) {
    throw new AppError("NOT_FOUND", "Professional not found");
  }

  const details = profile.professionalDetails;
  const businessLinks = profile.businessLinks
    .filter((link) => !link.business.deletedAt)
    .map((link) => ({
      name: link.business.name,
      industryName: link.business.industry?.name ?? null,
      description: link.business.description,
    }));
  const completion = calculateProfileCompletion(
    toCompletionInput({
      displayName: profile.displayName,
      location: profile.location,
      bio: profile.bio,
      hasHeadshot: Boolean(profile.profileImageStorageKey),
      profession: details?.profession ?? null,
      industryName: details?.industry?.name ?? null,
      yearsExperience: details?.yearsExperience ?? null,
      hasExperienceRows: profile.experiences.length > 0,
      skillNames: profile.profileSkills.map((ps) => ps.skill.name),
      serviceNames: profile.profileServices.map((ps) => ps.service.name),
      linkedinUrl: details?.linkedinUrl ?? null,
      serviceArea: profile.churchInformation?.serviceArea ?? null,
      lookingForSummary: details?.lookingForSummary ?? null,
      offeringSummary: details?.offeringSummary ?? null,
      opportunityPreferences: normalizeOpportunityPreferences(details?.opportunityPreferences),
      professionalSituation: profile.professionalSituation,
      businessLinks,
    }),
  );

  const prefs = normalizeOpportunityPreferences(details?.opportunityPreferences);

  return {
    id: profile.id,
    displayName: profile.displayName,
    location: profile.location,
    bio: profile.bio,
    hasHeadshot: Boolean(profile.profileImageStorageKey),
    email: includeContact ? profile.user.email : null,
    phone: includeContact ? profile.user.phone : null,
    canViewContact: includeContact,
    profession: details?.profession ?? null,
    industryName: details?.industry?.name ?? null,
    organisationName: details?.organisationName ?? null,
    yearsExperience: details?.yearsExperience ?? null,
    linkedinUrl: details?.linkedinUrl ?? null,
    websiteUrl: details?.websiteUrl ?? null,
    professionalSituation: profile.professionalSituation,
    skillNames: profile.profileSkills.map((ps) => ps.skill.name),
    serviceNames: profile.profileServices.map((ps) => ps.service.name),
    lookingForSummary: details?.lookingForSummary ?? null,
    offeringSummary: details?.offeringSummary ?? null,
    opportunityPreferences: prefs,
    serviceArea: profile.churchInformation?.serviceArea ?? null,
    profileStatus: profile.profileStatus,
    verificationStatus: profile.verificationStatus,
    verificationLabel: presentVerificationStatus(profile.verificationStatus).label,
    clarificationMessage: profile.clarificationMessage,
    visibilityStatus: profile.visibilityStatus,
    visibilityLabel: presentVisibilityStatus(profile.visibilityStatus).label,
    completionPercent: completion.percent,
    completionSections: completion.sections.map((s) => ({
      id: s.id,
      label: s.title,
      percent: Math.round(s.ratio * 100),
      complete: s.ratio >= 1,
    })),
    needsProfessionalVerificationAttention:
      profile.verificationStatus === "PENDING" || profile.verificationStatus === "UNDER_REVIEW",
    businesses: profile.businessLinks
      .filter((l) => !l.business.deletedAt)
      .map((l) => ({
        id: l.business.id,
        name: l.business.name,
        relationshipType: l.relationshipType,
        businessStatus: l.business.businessStatus,
        visibilityStatus: l.business.visibilityStatus,
      })),
    registeredAt: profile.user.createdAt.toISOString(),
  };
}

export type ExcoProfessionalDetail = {
  id: string;
  displayName: string;
  location: string | null;
  bio: string | null;
  hasHeadshot: boolean;
  email: string | null;
  phone: string | null;
  canViewContact: boolean;
  profession: string | null;
  industryName: string | null;
  organisationName: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  professionalSituation: string | null;
  skillNames: string[];
  serviceNames: string[];
  lookingForSummary: string | null;
  offeringSummary: string | null;
  opportunityPreferences: ReturnType<typeof normalizeOpportunityPreferences>;
  serviceArea: string | null;
  profileStatus: string;
  verificationStatus: VerificationStatus;
  verificationLabel: string;
  clarificationMessage: string | null;
  visibilityStatus: VisibilityStatus;
  visibilityLabel: string;
  completionPercent: number;
  completionSections: Array<{ id: string; label: string; percent: number; complete: boolean }>;
  needsProfessionalVerificationAttention: boolean;
  businesses: Array<{
    id: string;
    name: string;
    relationshipType: string;
    businessStatus: string;
    visibilityStatus: string;
  }>;
  registeredAt: string;
};
