import type { PrismaClient } from "@prisma/client";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "@/features/profile/completion";
import { registrationWindowStartUtc } from "@/features/exco/metric-window";

export type ExcoDashboardMetrics = {
  newRegistrationsLast30Days: number;
  totalProfessionals: number;
  completeProfiles: number;
  businesses: number;
  seekingEmployment: number;
  pendingProfessionalVerification: number;
  pendingBusinessVerification: number;
  verifiedProfessionals: number;
  verifiedBusinesses: number;
  computedAt: string;
  registrationWindowStartIso: string;
};

/** Authoritative metric computation (no auth). Safe for scripts + server. */
export async function computeExcoDashboardMetrics(
  prisma: PrismaClient,
  now: Date = new Date(),
): Promise<ExcoDashboardMetrics> {
  const windowStart = registrationWindowStartUtc(now, 30);

  const [
    newRegistrationsLast30Days,
    totalProfessionals,
    businesses,
    seekingEmployment,
    pendingProfessionalVerification,
    pendingBusinessVerification,
    verifiedProfessionals,
    verifiedBusinesses,
    profilesForCompletion,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: windowStart },
        profile: { is: { deletedAt: null } },
      },
    }),
    prisma.profile.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { deletedAt: null } }),
    prisma.profile.count({
      where: { deletedAt: null, professionalSituation: "Job seeker" },
    }),
    prisma.profile.count({
      where: {
        deletedAt: null,
        verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    }),
    prisma.business.count({
      where: {
        deletedAt: null,
        businessStatus: { in: ["SUBMITTED", "PENDING_REVIEW"] },
      },
    }),
    prisma.profile.count({
      where: { deletedAt: null, verificationStatus: "VERIFIED" },
    }),
    prisma.business.count({
      where: { deletedAt: null, businessStatus: "APPROVED" },
    }),
    prisma.profile.findMany({
      where: { deletedAt: null },
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
    }),
  ]);

  let completeProfiles = 0;
  for (const profile of profilesForCompletion) {
    const details = profile.professionalDetails;
    const businessLinks = profile.businessLinks
      .filter((link) => !link.business.deletedAt)
      .map((link) => ({
        name: link.business.name,
        industryName: link.business.industry?.name ?? null,
        description: link.business.description,
      }));
    const result = calculateProfileCompletion(
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
    if (result.percent === 100) {
      completeProfiles += 1;
    }
  }

  return {
    newRegistrationsLast30Days,
    totalProfessionals,
    completeProfiles,
    businesses,
    seekingEmployment,
    pendingProfessionalVerification,
    pendingBusinessVerification,
    verifiedProfessionals,
    verifiedBusinesses,
    computedAt: now.toISOString(),
    registrationWindowStartIso: windowStart.toISOString(),
  };
}
