import { describe, expect, it, vi } from "vitest";
import { computeExcoAnalytics } from "@/features/exco/analytics/compute-analytics";
import type { PrismaClient } from "@prisma/client";

const emptyQuery = {
  situation: null,
  industry: null,
  verification: null,
  directoryEffective: null,
  registrationDays: 30,
} as const;

/** Adversarial: analytics payload must not become a PII extraction channel. */
describe("Phase 20 analytics payload privacy", () => {
  it("serializes without email, phone, address, consent, or auth secrets", async () => {
    const prisma = {
      profile: {
        findMany: vi.fn(async () => [
          {
            id: "p1",
            displayName: "Secret Name",
            location: "Lagos",
            bio: "bio",
            professionalSituation: "Employee",
            verificationStatus: "NOT_REVIEWED",
            visibilityStatus: "PRIVATE",
            publicSlug: null,
            deletedAt: null,
            profileImageStorageKey: "bucket/key",
            user: { id: "u1", createdAt: new Date(), deletedAt: null },
            professionalDetails: {
              profession: "Engineer",
              yearsExperience: 1,
              linkedinUrl: null,
              lookingForSummary: "x",
              offeringSummary: "y",
              opportunityPreferences: {},
              industry: { name: "Technology", isActive: true },
            },
            churchInformation: { serviceArea: "Yoruba" },
            experiences: [],
            profileSkills: [],
            profileServices: [],
            businessLinks: [],
            visibilityPreferences: [],
          },
        ]),
      },
      business: { findMany: vi.fn(async () => []) },
      user: { count: vi.fn(async () => 0) },
    } as unknown as PrismaClient;

    const snap = await computeExcoAnalytics(prisma, emptyQuery);
    const json = JSON.stringify(snap);
    expect(json).not.toMatch(/@/);
    expect(json.toLowerCase()).not.toContain("phone");
    expect(json.toLowerCase()).not.toContain("email");
    expect(json.toLowerCase()).not.toContain("consent");
    expect(json).not.toContain("Secret Name");
    expect(json).not.toContain("bucket/key");
    expect(json).not.toContain('"u1"');
    expect(json).not.toContain('"p1"');
  });
});
