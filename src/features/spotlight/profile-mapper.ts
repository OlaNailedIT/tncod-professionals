import "server-only";

import { normalizeOpportunityPreferences } from "@/features/profile/completion";
import {
  evaluateSpotlightEligibility,
  isAuthoritativeHeadshotAvailable,
  toCompletionInput,
  type SpotlightEligibilityResult,
} from "@/features/spotlight/eligibility";
import {
  assertSpotlightProfessionalProjection,
  type SpotlightProfessionalProjection,
} from "@/features/spotlight/projection";

/** Shared Prisma include for Spotlight eligibility + projection. */
export const spotlightProfileInclude = {
  user: { select: { accountStatus: true, deletedAt: true } },
  professionalDetails: {
    include: { industry: { select: { name: true, isActive: true } } },
  },
  experiences: { select: { id: true }, take: 1 },
  profileSkills: {
    include: { skill: { select: { name: true, isActive: true } } },
  },
  profileServices: {
    include: { service: { select: { name: true, isActive: true } } },
  },
  churchInformation: { select: { serviceArea: true } },
  businessLinks: {
    where: { business: { deletedAt: null } },
    select: {
      relationshipType: true,
      business: {
        select: {
          name: true,
          description: true,
          businessStatus: true,
          industry: { select: { name: true } },
        },
      },
    },
  },
} as const;

export type SpotlightProfileRow = {
  id: string;
  displayName: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  professionalSituation: string | null;
  profileImageStorageKey: string | null;
  spotlightInterest: boolean;
  verificationStatus: string;
  visibilityStatus: string;
  deletedAt: Date | null;
  user: { accountStatus: string; deletedAt: Date | null };
  professionalDetails: {
    profession: string | null;
    professionalTitle: string | null;
    yearsExperience: number | null;
    lookingForSummary: string | null;
    offeringSummary: string | null;
    opportunityPreferences: unknown;
    linkedinUrl: string | null;
    websiteUrl: string | null;
    industry: { name: string; isActive: boolean } | null;
  } | null;
  experiences: Array<{ id: string }>;
  profileSkills: Array<{ skill: { name: string; isActive: boolean } }>;
  profileServices: Array<{ service: { name: string; isActive: boolean } }>;
  churchInformation: { serviceArea: string | null } | null;
  businessLinks: Array<{
    relationshipType: string;
    business: {
      name: string;
      description: string | null;
      businessStatus: string;
      industry: { name: string } | null;
    };
  }>;
};

export function evaluateProfileSpotlightEligibility(
  profile: SpotlightProfileRow,
): SpotlightEligibilityResult {
  const hasHeadshot = isAuthoritativeHeadshotAvailable(profile.profileImageStorageKey);
  const skillNames = profile.profileSkills
    .filter((ps) => ps.skill.isActive)
    .map((ps) => ps.skill.name);
  const serviceNames = profile.profileServices
    .filter((ps) => ps.service.isActive)
    .map((ps) => ps.service.name);
  const industryName =
    profile.professionalDetails?.industry?.isActive === false
      ? null
      : (profile.professionalDetails?.industry?.name ?? null);

  const completionInput = toCompletionInput({
    displayName: profile.displayName,
    location: profile.location,
    bio: profile.bio,
    hasHeadshot,
    profession: profile.professionalDetails?.profession ?? null,
    industryName,
    yearsExperience: profile.professionalDetails?.yearsExperience ?? null,
    hasExperienceRows: profile.experiences.length > 0,
    skillNames,
    serviceNames,
    linkedinUrl: profile.professionalDetails?.linkedinUrl ?? null,
    serviceArea: profile.churchInformation?.serviceArea ?? null,
    lookingForSummary: profile.professionalDetails?.lookingForSummary ?? null,
    offeringSummary: profile.professionalDetails?.offeringSummary ?? null,
    opportunityPreferences: normalizeOpportunityPreferences(
      profile.professionalDetails?.opportunityPreferences,
    ),
    professionalSituation: profile.professionalSituation,
    businessLinks: profile.businessLinks.map((b) => ({
      name: b.business.name,
      industryName: b.business.industry?.name ?? null,
      description: b.business.description,
    })),
  });

  return evaluateSpotlightEligibility({
    spotlightInterest: profile.spotlightInterest,
    verificationStatus: profile.verificationStatus,
    deletedAt: profile.deletedAt ?? profile.user.deletedAt,
    accountStatus: profile.user.accountStatus,
    hasHeadshot,
    completionInput,
  });
}

export function projectSpotlightProfessional(
  profile: SpotlightProfileRow,
): SpotlightProfessionalProjection {
  const eligibility = evaluateProfileSpotlightEligibility(profile);
  const hasHeadshot = isAuthoritativeHeadshotAvailable(profile.profileImageStorageKey);

  const projected: SpotlightProfessionalProjection = {
    profileId: profile.id,
    displayName: profile.displayName,
    headline: profile.headline,
    location: profile.location,
    bio: profile.bio,
    profession: profile.professionalDetails?.profession ?? null,
    professionalTitle: profile.professionalDetails?.professionalTitle ?? null,
    industryName:
      profile.professionalDetails?.industry?.isActive === false
        ? null
        : (profile.professionalDetails?.industry?.name ?? null),
    skillNames: profile.profileSkills
      .filter((ps) => ps.skill.isActive)
      .map((ps) => ps.skill.name)
      .sort((a, b) => a.localeCompare(b)),
    serviceNames: profile.profileServices
      .filter((ps) => ps.service.isActive)
      .map((ps) => ps.service.name)
      .sort((a, b) => a.localeCompare(b)),
    linkedinUrl: profile.professionalDetails?.linkedinUrl ?? null,
    websiteUrl: profile.professionalDetails?.websiteUrl ?? null,
    hasHeadshot,
    verificationStatus: profile.verificationStatus,
    visibilityStatus: profile.visibilityStatus,
    spotlightInterest: profile.spotlightInterest,
    completionPercent: eligibility.completionPercent,
    eligibility: {
      eligible: eligibility.eligible,
      interest: eligibility.interest,
      profileComplete: eligibility.profileComplete,
      headshotAvailable: eligibility.headshotAvailable,
      verified: eligibility.verified,
    },
  };

  assertSpotlightProfessionalProjection(projected);
  return projected;
}
