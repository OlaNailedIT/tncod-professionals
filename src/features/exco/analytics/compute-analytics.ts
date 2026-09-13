/**
 * Phase 20 — authoritative analytics aggregation (no auth).
 * Read-only Prisma queries over source-of-truth domains.
 */
import type { PrismaClient, VerificationStatus } from "@prisma/client";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "@/features/profile/completion";
import { registrationWindowStartUtc } from "@/features/exco/metric-window";
import { defaultPreferenceMap } from "@/features/visibility/groups";
import { suppressBreakdown, type PrivacyBreakdownRow } from "@/features/exco/analytics/privacy";
import type { AnalyticsQuery } from "@/features/exco/analytics/query";

export type UnavailableMetric = {
  key: string;
  label: string;
  status: "unavailable" | "deferred" | "prerequisite";
  reason: string;
};

export type ExcoAnalyticsSnapshot = {
  computedAt: string;
  filters: AnalyticsQuery;
  memberPopulation: number;
  community: {
    professions: PrivacyBreakdownRow[];
    industries: PrivacyBreakdownRow[];
    locations: PrivacyBreakdownRow[];
    situations: PrivacyBreakdownRow[];
    businessesTotal: number;
    businessesByStatus: Array<{ key: string; count: number }>;
  };
  needs: {
    jobSeekers: number;
    mentorshipInterest: number;
    trainingInterest: number;
    collaborationInterest: number;
    referralsInterest: number;
    unavailable: UnavailableMetric[];
  };
  capacity: {
    skills: PrivacyBreakdownRow[];
    services: PrivacyBreakdownRow[];
    businessOwners: number;
    unavailable: UnavailableMetric[];
  };
  systemHealth: {
    newRegistrations: number;
    registrationWindowStartIso: string;
    registrationDays: number;
    memberPopulation: number;
    completeProfiles: number;
    profileCompletionRate: number | null;
    verifiedProfessionals: number;
    professionalVerificationRate: number | null;
    businessesTotal: number;
    verifiedBusinesses: number;
    businessVerificationRate: number | null;
    directoryEffectivePublished: number;
    /** Preference counts for identity group — NOT effective publication */
    identityPreferenceByLevel: Array<{ key: string; count: number }>;
    unavailable: UnavailableMetric[];
  };
};

function inc(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function toBreakdown(map: Map<string, number>): PrivacyBreakdownRow[] {
  return suppressBreakdown(
    [...map.entries()].map(([key, count]) => ({ key, count })),
  );
}

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

function isDirectoryPublished(p: {
  verificationStatus: VerificationStatus;
  visibilityStatus: string;
  publicSlug: string | null;
  deletedAt: Date | null;
}): boolean {
  return (
    p.deletedAt == null &&
    p.verificationStatus === "VERIFIED" &&
    p.visibilityStatus === "DIRECTORY" &&
    Boolean(p.publicSlug)
  );
}

export async function computeExcoAnalytics(
  prisma: PrismaClient,
  filters: AnalyticsQuery,
  now: Date = new Date(),
): Promise<ExcoAnalyticsSnapshot> {
  const windowStart = registrationWindowStartUtc(now, filters.registrationDays);

  const profiles = await prisma.profile.findMany({
    where: {
      deletedAt: null,
      user: { is: { deletedAt: null } },
    },
    include: {
      user: { select: { id: true, createdAt: true, deletedAt: true } },
      professionalDetails: { include: { industry: { select: { name: true, isActive: true } } } },
      churchInformation: true,
      experiences: { select: { id: true }, take: 1 },
      profileSkills: {
        include: { skill: { select: { name: true, isActive: true } } },
      },
      profileServices: {
        include: { service: { select: { name: true, isActive: true } } },
      },
      businessLinks: {
        include: {
          business: {
            select: {
              id: true,
              name: true,
              description: true,
              deletedAt: true,
              businessStatus: true,
              industry: { select: { name: true } },
            },
          },
        },
      },
      visibilityPreferences: {
        select: { groupKey: true, preference: true },
      },
    },
  });

  const filtered = profiles.filter((p) => {
    if (filters.situation && p.professionalSituation !== filters.situation) return false;
    if (filters.verification && p.verificationStatus !== filters.verification) return false;
    if (filters.industry) {
      const name = p.professionalDetails?.industry?.isActive
        ? p.professionalDetails.industry.name
        : null;
      if (name !== filters.industry) return false;
    }
    if (filters.directoryEffective === "published" && !isDirectoryPublished(p)) return false;
    if (filters.directoryEffective === "not_published" && isDirectoryPublished(p)) return false;
    return true;
  });

  const memberPopulation = filtered.length;

  const professionMap = new Map<string, number>();
  const industryMap = new Map<string, number>();
  const locationMap = new Map<string, number>();
  const situationMap = new Map<string, number>();
  const skillMap = new Map<string, number>();
  const serviceMap = new Map<string, number>();
  const prefLevelMap = new Map<string, number>();

  let completeProfiles = 0;
  let verifiedProfessionals = 0;
  let directoryEffectivePublished = 0;
  let jobSeekers = 0;
  let mentorshipInterest = 0;
  let trainingInterest = 0;
  let collaborationInterest = 0;
  let referralsInterest = 0;
  let businessOwners = 0;

  const businessIds = new Set<string>();
  const businessStatusMap = new Map<string, number>();

  for (const p of filtered) {
    const details = p.professionalDetails;
    const profession = details?.profession?.trim() || "(unknown)";
    inc(professionMap, profession);

    const industryName =
      details?.industry?.isActive && details.industry.name
        ? details.industry.name
        : "(unknown)";
    inc(industryMap, industryName);

    const location = p.location?.trim() || "(unknown)";
    inc(locationMap, location);

    const situation = p.professionalSituation?.trim() || "(unknown)";
    inc(situationMap, situation);

    if (p.verificationStatus === "VERIFIED") verifiedProfessionals += 1;
    if (isDirectoryPublished(p)) directoryEffectivePublished += 1;
    if (p.professionalSituation === "Job seeker") jobSeekers += 1;

    const prefs = normalizeOpportunityPreferences(details?.opportunityPreferences);
    if (prefs.mentorship === true) mentorshipInterest += 1;
    if (prefs.training === true) trainingInterest += 1;
    if (prefs.collaboration === true) collaborationInterest += 1;
    if (prefs.referrals === true) referralsInterest += 1;

    const seenSkills = new Set<string>();
    for (const ps of p.profileSkills) {
      if (!ps.skill.isActive) continue;
      if (seenSkills.has(ps.skill.name)) continue;
      seenSkills.add(ps.skill.name);
      inc(skillMap, ps.skill.name);
    }
    const seenServices = new Set<string>();
    for (const ps of p.profileServices) {
      if (!ps.service.isActive) continue;
      if (seenServices.has(ps.service.name)) continue;
      seenServices.add(ps.service.name);
      inc(serviceMap, ps.service.name);
    }

    let isOwner = false;
    for (const link of p.businessLinks) {
      if (link.business.deletedAt) continue;
      businessIds.add(link.business.id);
      if (link.relationshipType === "OWNER") isOwner = true;
    }
    if (isOwner) businessOwners += 1;

    // Identity group preference (defaults PUBLIC) — not effective publication
    const defaults = defaultPreferenceMap();
    const identityPref =
      p.visibilityPreferences.find((r) => r.groupKey === "identity")?.preference ??
      defaults.identity;
    inc(prefLevelMap, identityPref);

    const businessLinks = p.businessLinks
      .filter((link) => !link.business.deletedAt)
      .map((link) => ({
        name: link.business.name,
        industryName: link.business.industry?.name ?? null,
        description: link.business.description,
      }));

    const completion = calculateProfileCompletion(
      toCompletionInput({
        displayName: p.displayName,
        location: p.location,
        bio: p.bio,
        hasHeadshot: Boolean(p.profileImageStorageKey),
        profession: details?.profession ?? null,
        industryName: details?.industry?.name ?? null,
        yearsExperience: details?.yearsExperience ?? null,
        hasExperienceRows: p.experiences.length > 0,
        skillNames: p.profileSkills.map((ps) => ps.skill.name),
        serviceNames: p.profileServices.map((ps) => ps.service.name),
        linkedinUrl: details?.linkedinUrl ?? null,
        serviceArea: p.churchInformation?.serviceArea ?? null,
        lookingForSummary: details?.lookingForSummary ?? null,
        offeringSummary: details?.offeringSummary ?? null,
        opportunityPreferences: prefs,
        professionalSituation: p.professionalSituation,
        businessLinks,
      }),
    );
    if (completion.percent === 100) completeProfiles += 1;
  }

  // Business totals: when member filters active, count unique businesses linked to filtered members;
  // when no member-attribute filters, count all non-deleted businesses (Phase 10 semantics).
  const memberFilterActive = Boolean(
    filters.situation || filters.industry || filters.verification || filters.directoryEffective,
  );

  let businessesTotal: number;
  let verifiedBusinesses: number;
  if (memberFilterActive) {
    businessesTotal = businessIds.size;
    const linked = await prisma.business.findMany({
      where: { id: { in: [...businessIds] }, deletedAt: null },
      select: { businessStatus: true },
    });
    verifiedBusinesses = linked.filter((b) => b.businessStatus === "APPROVED").length;
    for (const b of linked) inc(businessStatusMap, b.businessStatus);
  } else {
    const allBiz = await prisma.business.findMany({
      where: { deletedAt: null },
      select: { businessStatus: true },
    });
    businessesTotal = allBiz.length;
    verifiedBusinesses = allBiz.filter((b) => b.businessStatus === "APPROVED").length;
    for (const b of allBiz) inc(businessStatusMap, b.businessStatus);
  }

  // New platform registrations only: exclude Phase 18 historical imports
  // (`profiles.legacy_import = true`). Import-time users.created_at must not
  // count as genuine onboarding registrations (Phase 20 closure decision).
  const newRegistrations = await prisma.user.count({
    where: {
      deletedAt: null,
      createdAt: { gte: windowStart },
      profile: { is: { deletedAt: null, legacyImport: false } },
    },
  });

  const needsUnavailable: UnavailableMetric[] = [
    {
      key: "clients",
      label: "Client needs",
      status: "deferred",
      reason: "No structured client-need field exists. Free-text inference is not used.",
    },
  ];
  const capacityUnavailable: UnavailableMetric[] = [
    {
      key: "mentors",
      label: "Mentors",
      status: "deferred",
      reason: "Mentorship interest preference is not mentor capacity.",
    },
    {
      key: "volunteers",
      label: "Volunteers",
      status: "deferred",
      reason: "No volunteer capacity field is collected.",
    },
  ];
  const healthUnavailable: UnavailableMetric[] = [
    {
      key: "registration-conversion",
      label: "Registration conversion",
      status: "prerequisite",
      reason: "Registration start events are logged only — not persisted for analytics.",
    },
    {
      key: "abandonment",
      label: "Registration abandonment",
      status: "prerequisite",
      reason: "Abandonment cannot be retrospectively calculated without a persisted event store.",
    },
  ];

  return {
    computedAt: now.toISOString(),
    filters,
    memberPopulation,
    community: {
      professions: toBreakdown(professionMap),
      industries: toBreakdown(industryMap),
      locations: toBreakdown(locationMap),
      situations: toBreakdown(situationMap),
      businessesTotal,
      businessesByStatus: [...businessStatusMap.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
    },
    needs: {
      jobSeekers,
      mentorshipInterest,
      trainingInterest,
      collaborationInterest,
      referralsInterest,
      unavailable: needsUnavailable,
    },
    capacity: {
      skills: toBreakdown(skillMap),
      services: toBreakdown(serviceMap),
      businessOwners,
      unavailable: capacityUnavailable,
    },
    systemHealth: {
      newRegistrations,
      registrationWindowStartIso: windowStart.toISOString(),
      registrationDays: filters.registrationDays,
      memberPopulation,
      completeProfiles,
      profileCompletionRate: rate(completeProfiles, memberPopulation),
      verifiedProfessionals,
      professionalVerificationRate: rate(verifiedProfessionals, memberPopulation),
      businessesTotal,
      verifiedBusinesses,
      businessVerificationRate: rate(verifiedBusinesses, businessesTotal),
      directoryEffectivePublished,
      identityPreferenceByLevel: [...prefLevelMap.entries()]
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)),
      unavailable: healthUnavailable,
    },
  };
}
