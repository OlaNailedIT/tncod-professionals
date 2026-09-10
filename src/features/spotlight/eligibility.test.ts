import { describe, expect, it } from "vitest";
import {
  evaluateSpotlightEligibility,
  isAuthoritativeHeadshotAvailable,
} from "@/features/spotlight/eligibility";
import {
  assertSpotlightProfessionalProjection,
  SPOTLIGHT_FORBIDDEN_KEYS,
  type SpotlightProfessionalProjection,
} from "@/features/spotlight/projection";
import type { ProfileCompletionInput } from "@/features/profile/completion";

function fullCompletion(): ProfileCompletionInput {
  return {
    displayName: "Ada Lovelace",
    hasHeadshot: true,
    location: "Johannesburg",
    bio: "Engineer and community builder.",
    profession: "Software engineer",
    industryName: "Technology",
    yearsExperience: 8,
    hasExperienceRows: true,
    skillNames: ["TypeScript", "Leadership"],
    serviceNames: ["Mentoring"],
    linkedinUrl: "https://www.linkedin.com/in/ada",
    serviceArea: "Youth",
    lookingForSummary: "Peers",
    offeringSummary: "Mentorship",
    opportunityPreferences: {
      collaboration: true,
      mentorship: false,
      referrals: true,
      training: false,
    },
    professionalSituation: "Employee",
    businessLinks: [],
  };
}

describe("isAuthoritativeHeadshotAvailable", () => {
  it("requires non-empty storage key", () => {
    expect(isAuthoritativeHeadshotAvailable(null)).toBe(false);
    expect(isAuthoritativeHeadshotAvailable("")).toBe(false);
    expect(isAuthoritativeHeadshotAvailable("   ")).toBe(false);
    expect(isAuthoritativeHeadshotAvailable("profiles/abc/headshot.jpg")).toBe(true);
  });
});

describe("evaluateSpotlightEligibility", () => {
  const base = {
    spotlightInterest: true,
    verificationStatus: "VERIFIED" as const,
    deletedAt: null,
    accountStatus: "ACTIVE",
    hasHeadshot: true,
    completionInput: fullCompletion(),
  };

  it("returns true when all gates pass", () => {
    const r = evaluateSpotlightEligibility(base);
    expect(r.eligible).toBe(true);
    expect(r.completionPercent).toBe(100);
  });

  it("fails when interest is false", () => {
    expect(evaluateSpotlightEligibility({ ...base, spotlightInterest: false }).eligible).toBe(false);
  });

  it("fails when completion < 100", () => {
    expect(
      evaluateSpotlightEligibility({
        ...base,
        completionInput: { ...fullCompletion(), bio: null },
      }).eligible,
    ).toBe(false);
  });

  it("fails when headshot missing", () => {
    expect(evaluateSpotlightEligibility({ ...base, hasHeadshot: false }).eligible).toBe(false);
  });

  it("fails when verification is not VERIFIED", () => {
    expect(
      evaluateSpotlightEligibility({ ...base, verificationStatus: "PENDING" }).eligible,
    ).toBe(false);
  });

  it("does not require DIRECTORY visibility", () => {
    // Visibility is not an eligibility input — MEMBERS_ONLY/PRIVATE still eligible if gates pass.
    expect(evaluateSpotlightEligibility(base).eligible).toBe(true);
  });
});

describe("SpotlightProfessionalProjection allowlist", () => {
  it("rejects forbidden contact/business/storage keys", () => {
    const good: SpotlightProfessionalProjection = {
      profileId: "00000000-0000-4000-8000-000000000001",
      displayName: "Ada",
      headline: null,
      location: "Cape Town",
      bio: "Bio",
      profession: "Engineer",
      professionalTitle: null,
      industryName: "Technology",
      skillNames: [],
      serviceNames: [],
      linkedinUrl: null,
      websiteUrl: null,
      hasHeadshot: true,
      verificationStatus: "VERIFIED",
      visibilityStatus: "PRIVATE",
      spotlightInterest: true,
      completionPercent: 100,
      eligibility: {
        eligible: true,
        interest: true,
        profileComplete: true,
        headshotAvailable: true,
        verified: true,
      },
    };
    expect(() => assertSpotlightProfessionalProjection(good)).not.toThrow();

    for (const key of SPOTLIGHT_FORBIDDEN_KEYS) {
      expect(() =>
        assertSpotlightProfessionalProjection({ ...good, [key]: "leak" }),
      ).toThrow(/forbidden field/);
    }
  });
});
