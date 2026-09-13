import { describe, expect, it, vi } from "vitest";
import { computeExcoAnalytics } from "@/features/exco/analytics/compute-analytics";
import type { AnalyticsQuery } from "@/features/exco/analytics/query";
import type { PrismaClient } from "@prisma/client";

function profile(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    displayName: `Name ${id}`,
    location: "Lagos",
    bio: "Bio text here",
    professionalSituation: "Employee",
    verificationStatus: "NOT_REVIEWED",
    visibilityStatus: "PRIVATE",
    publicSlug: null,
    deletedAt: null,
    profileImageStorageKey: null,
    user: { id: `u-${id}`, createdAt: new Date("2026-01-01"), deletedAt: null },
    professionalDetails: {
      profession: "Engineer",
      yearsExperience: 5,
      linkedinUrl: null,
      lookingForSummary: "Peers",
      offeringSummary: "Help",
      opportunityPreferences: { mentorship: false },
      industry: { name: "Technology", isActive: true },
    },
    churchInformation: { serviceArea: "Yoruba" },
    experiences: [{ id: `e-${id}` }],
    profileSkills: [{ skill: { name: "TypeScript", isActive: true } }],
    profileServices: [],
    businessLinks: [],
    visibilityPreferences: [],
    ...overrides,
  };
}

const emptyQuery: AnalyticsQuery = {
  situation: null,
  industry: null,
  verification: null,
  directoryEffective: null,
  registrationDays: 30,
};

describe("Phase 20 forensic — filtered suppression & denominators", () => {
  it("applies n<3 suppression after filters (final cohort)", async () => {
    const profiles = [
      profile("1", {
        professionalSituation: "Job seeker",
        professionalDetails: {
          profession: "RareA",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: { mentorship: true },
          industry: { name: "Technology", isActive: true },
        },
      }),
      profile("2", {
        professionalSituation: "Job seeker",
        professionalDetails: {
          profession: "RareB",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: { name: "Technology", isActive: true },
        },
        profileSkills: [],
      }),
      profile("3", {
        professionalSituation: "Employee",
        professionalDetails: {
          profession: "Engineer",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: { name: "Finance", isActive: true },
        },
        profileSkills: [],
      }),
    ];

    const prisma = {
      profile: { findMany: vi.fn(async () => profiles) },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;

    const filtered = await computeExcoAnalytics(prisma, {
      ...emptyQuery,
      situation: "Job seeker",
    });

    expect(filtered.memberPopulation).toBe(2);
    // Composition keys must not leak rare professions for n=1 each
    expect(filtered.community.professions.every((r) => r.key === "(suppressed)" || r.count >= 3)).toBe(
      true,
    );
    expect(filtered.community.professions.find((r) => r.key === "RareA")).toBeUndefined();
    expect(filtered.community.professions.find((r) => r.key === "RareB")).toBeUndefined();
    expect(filtered.community.professions.find((r) => r.suppressed)?.count).toBe(2);

    // Contract: totals / needs counts are not composition breakdowns — remain unsuppressed
    expect(filtered.needs.jobSeekers).toBe(2);
    expect(filtered.needs.mentorshipInterest).toBe(1);
  });

  it("uses member population as verification & completion denominator", async () => {
    const profiles = [
      profile("1", { verificationStatus: "VERIFIED" }),
      profile("2", { verificationStatus: "NOT_REVIEWED" }),
      profile("3", { verificationStatus: "PENDING" }),
    ];
    const prisma = {
      profile: { findMany: vi.fn(async () => profiles) },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;

    const snap = await computeExcoAnalytics(prisma, emptyQuery);
    expect(snap.systemHealth.memberPopulation).toBe(3);
    expect(snap.systemHealth.verifiedProfessionals).toBe(1);
    expect(snap.systemHealth.professionalVerificationRate).toBe(33.3);
    // Completion uses Phase 8 — fixtures are incomplete → 0%
    expect(snap.systemHealth.completeProfiles).toBe(0);
    expect(snap.systemHealth.profileCompletionRate).toBe(0);
  });

  it("situations metric is professional_situation (employment/situation contract)", async () => {
    const profiles = [
      profile("1", { professionalSituation: "Employee" }),
      profile("2", { professionalSituation: "Employee" }),
      profile("3", { professionalSituation: "Employee" }),
      profile("4", { professionalSituation: "Job seeker" }),
      profile("5", {
        professionalSituation: "Job seeker",
        profileSkills: [],
        professionalDetails: {
          profession: "Engineer",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: { name: "Technology", isActive: true },
        },
      }),
      profile("6", {
        professionalSituation: "Job seeker",
        profileSkills: [],
        professionalDetails: {
          profession: "Engineer",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: { name: "Technology", isActive: true },
        },
      }),
    ];
    const prisma = {
      profile: { findMany: vi.fn(async () => profiles) },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;

    const snap = await computeExcoAnalytics(prisma, emptyQuery);
    const employee = snap.community.situations.find((r) => r.key === "Employee");
    const seekers = snap.community.situations.find((r) => r.key === "Job seeker");
    expect(employee?.count).toBe(3);
    expect(seekers?.count).toBe(3);
    expect(snap.needs.jobSeekers).toBe(3);
  });

  it("documents residual difference risk: population minus visible groups", async () => {
    // Contract suppresses composition keys at n<3 but still exposes memberPopulation.
    // Differencing: population − sum(visible group counts) = suppressed mass (already shown as bucket).
    const profiles = Array.from({ length: 5 }, (_, i) =>
      profile(String(i), {
        professionalDetails: {
          profession: i < 3 ? "Engineer" : `Solo${i}`,
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: { name: "Technology", isActive: true },
        },
        profileSkills: [],
      }),
    );
    const prisma = {
      profile: { findMany: vi.fn(async () => profiles) },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;

    const snap = await computeExcoAnalytics(prisma, emptyQuery);
    const visible = snap.community.professions
      .filter((r) => !r.suppressed)
      .reduce((s, r) => s + r.count, 0);
    const suppressed = snap.community.professions.find((r) => r.suppressed)?.count ?? 0;
    expect(visible + suppressed).toBe(snap.memberPopulation);
    // Keys of Solo* groups must not appear
    expect(snap.community.professions.some((r) => r.key.startsWith("Solo"))).toBe(false);
  });
});
