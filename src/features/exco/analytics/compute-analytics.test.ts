import { describe, expect, it, vi } from "vitest";
import { computeExcoAnalytics } from "@/features/exco/analytics/compute-analytics";
import type { AnalyticsQuery } from "@/features/exco/analytics/query";
import type { PrismaClient } from "@prisma/client";

const emptyQuery: AnalyticsQuery = {
  situation: null,
  industry: null,
  verification: null,
  directoryEffective: null,
  registrationDays: 30,
};

function baseProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: "p1",
    displayName: "Alex",
    location: "Lagos",
    bio: "Bio text here",
    professionalSituation: "Employee",
    verificationStatus: "NOT_REVIEWED",
    visibilityStatus: "PRIVATE",
    publicSlug: null,
    deletedAt: null,
    profileImageStorageKey: null,
    user: { id: "u1", createdAt: new Date("2026-09-01"), deletedAt: null },
    professionalDetails: {
      profession: "Engineer",
      yearsExperience: 5,
      linkedinUrl: "https://www.linkedin.com/in/alex",
      lookingForSummary: "Peers",
      offeringSummary: "Help",
      opportunityPreferences: {
        mentorship: true,
        training: false,
        collaboration: true,
        referrals: false,
      },
      industry: { name: "Technology", isActive: true },
    },
    churchInformation: { serviceArea: "Yoruba" },
    experiences: [{ id: "e1" }],
    profileSkills: [{ skill: { name: "TypeScript", isActive: true } }],
    profileServices: [{ service: { name: "Consulting", isActive: true } }],
    businessLinks: [],
    visibilityPreferences: [],
    ...overrides,
  };
}

describe("Phase 20 computeExcoAnalytics", () => {
  it("counts unique businesses once with multiple professionals", async () => {
    const biz = {
      id: "b1",
      name: "Acme",
      description: "Co",
      deletedAt: null,
      businessStatus: "APPROVED",
      industry: { name: "Finance" },
    };
    const profiles = [
      baseProfile({
        id: "p1",
        user: { id: "u1", createdAt: new Date(), deletedAt: null },
        businessLinks: [{ relationshipType: "OWNER", business: biz }],
      }),
      baseProfile({
        id: "p2",
        displayName: "Sam",
        location: "Abuja",
        user: { id: "u2", createdAt: new Date(), deletedAt: null },
        professionalDetails: {
          profession: "Accountant",
          yearsExperience: 3,
          linkedinUrl: null,
          lookingForSummary: "Work",
          offeringSummary: "Tax",
          opportunityPreferences: {},
          industry: { name: "Finance", isActive: true },
        },
        businessLinks: [{ relationshipType: "EMPLOYEE", business: biz }],
        profileSkills: [],
        profileServices: [],
      }),
    ];

    const prisma = {
      profile: { findMany: vi.fn(async () => profiles) },
      business: {
        findMany: vi.fn(async () => [{ businessStatus: "APPROVED" }]),
      },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;

    // no member filters → global business path
    const snap = await computeExcoAnalytics(prisma, emptyQuery, new Date("2026-09-11T12:00:00Z"));
    expect(snap.capacity.businessOwners).toBe(1);
    expect(prisma.business.findMany).toHaveBeenCalled();
    expect(snap.community.businessesTotal).toBe(1);
    expect(snap.systemHealth.verifiedBusinesses).toBe(1);
  });

  it("suppresses rare professions and keeps totals", async () => {
    const profiles = [
      baseProfile({
        id: "p1",
        professionalDetails: {
          profession: "RareOne",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: null,
        },
      }),
      baseProfile({
        id: "p2",
        user: { id: "u2", createdAt: new Date(), deletedAt: null },
        location: "Lagos",
        professionalDetails: {
          profession: "RareTwo",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: null,
        },
        profileSkills: [],
        profileServices: [],
      }),
      baseProfile({
        id: "p3",
        user: { id: "u3", createdAt: new Date(), deletedAt: null },
        location: "Lagos",
        professionalDetails: {
          profession: "Engineer",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: null,
        },
        profileSkills: [],
        profileServices: [],
      }),
      baseProfile({
        id: "p4",
        user: { id: "u4", createdAt: new Date(), deletedAt: null },
        location: "Lagos",
        professionalDetails: {
          profession: "Engineer",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: null,
        },
        profileSkills: [],
        profileServices: [],
      }),
      baseProfile({
        id: "p5",
        user: { id: "u5", createdAt: new Date(), deletedAt: null },
        location: "Lagos",
        professionalDetails: {
          profession: "Engineer",
          yearsExperience: 1,
          linkedinUrl: null,
          lookingForSummary: "a",
          offeringSummary: "b",
          opportunityPreferences: {},
          industry: null,
        },
        profileSkills: [],
        profileServices: [],
      }),
    ];

    const prisma = {
      profile: { findMany: vi.fn(async () => profiles) },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 2) },
    } as unknown as PrismaClient;

    const snap = await computeExcoAnalytics(prisma, emptyQuery);
    expect(snap.memberPopulation).toBe(5);
    expect(snap.community.professions.find((r) => r.key === "RareOne")).toBeUndefined();
    expect(snap.community.professions.find((r) => r.key === "Engineer")?.count).toBe(3);
    expect(snap.community.professions.find((r) => r.suppressed)?.count).toBe(2);
    expect(snap.systemHealth.newRegistrations).toBe(2);
    expect(snap.systemHealth.unavailable.map((u) => u.key)).toEqual(
      expect.arrayContaining(["registration-conversion", "abandonment"]),
    );
    expect(prisma.user.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          profile: { is: { deletedAt: null, legacyImport: false } },
        }),
      }),
    );
  });

  it("excludes legacy_import profiles from new platform registrations query", async () => {
    const prisma = {
      profile: { findMany: vi.fn(async () => [baseProfile()]) },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;
    await computeExcoAnalytics(prisma, emptyQuery, new Date("2026-09-11T12:00:00Z"));
    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        createdAt: { gte: expect.any(Date) },
        profile: { is: { deletedAt: null, legacyImport: false } },
      },
    });
  });

  it("keeps preference counts separate from directory publication", async () => {
    const profiles = [
      baseProfile({
        verificationStatus: "VERIFIED",
        visibilityStatus: "DIRECTORY",
        publicSlug: "alex",
        visibilityPreferences: [{ groupKey: "identity", preference: "PUBLIC" }],
      }),
      baseProfile({
        id: "p2",
        user: { id: "u2", createdAt: new Date(), deletedAt: null },
        verificationStatus: "NOT_REVIEWED",
        visibilityStatus: "PRIVATE",
        publicSlug: null,
        visibilityPreferences: [{ groupKey: "identity", preference: "PRIVATE" }],
        profileSkills: [],
        profileServices: [],
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
      baseProfile({
        id: "p3",
        user: { id: "u3", createdAt: new Date(), deletedAt: null },
        verificationStatus: "VERIFIED",
        visibilityStatus: "PRIVATE",
        publicSlug: null,
        visibilityPreferences: [],
        profileSkills: [],
        profileServices: [],
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
    expect(snap.systemHealth.directoryEffectivePublished).toBe(1);
    const prefs = Object.fromEntries(
      snap.systemHealth.identityPreferenceByLevel.map((r) => [r.key, r.count]),
    );
    expect(prefs.PUBLIC).toBe(2); // explicit + default
    expect(prefs.PRIVATE).toBe(1);
  });

  it("does not fabricate mentor or volunteer capacity", async () => {
    const prisma = {
      profile: { findMany: vi.fn(async () => [baseProfile()]) },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;
    const snap = await computeExcoAnalytics(prisma, emptyQuery);
    expect(snap.capacity.unavailable.map((u) => u.key)).toEqual(
      expect.arrayContaining(["mentors", "volunteers"]),
    );
    expect(snap.needs.mentorshipInterest).toBe(1);
  });
});
