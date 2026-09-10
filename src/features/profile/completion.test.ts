import { describe, expect, it } from "vitest";
import {
  calculateProfileCompletion,
  isBusinessApplicable,
  isFilledText,
  isValidLinkedInUrl,
  type ProfileCompletionInput,
} from "./completion";

function emptyProfile(overrides: Partial<ProfileCompletionInput> = {}): ProfileCompletionInput {
  return {
    displayName: null,
    hasHeadshot: false,
    location: null,
    bio: null,
    profession: null,
    industryName: null,
    yearsExperience: null,
    hasExperienceRows: false,
    skillNames: [],
    serviceNames: [],
    linkedinUrl: null,
    serviceArea: null,
    lookingForSummary: null,
    offeringSummary: null,
    opportunityPreferences: {},
    professionalSituation: "Employee",
    businessLinks: [],
    ...overrides,
  };
}

function fullNonBusiness(): ProfileCompletionInput {
  return emptyProfile({
    displayName: "Ada Lovelace",
    hasHeadshot: false,
    location: "Johannesburg",
    bio: "Engineer and community builder.",
    profession: "Software engineer",
    industryName: "Technology",
    yearsExperience: 8,
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
  });
}

describe("isFilledText", () => {
  it("rejects null, empty, whitespace, and placeholders", () => {
    expect(isFilledText(null)).toBe(false);
    expect(isFilledText("")).toBe(false);
    expect(isFilledText("   ")).toBe(false);
    expect(isFilledText("N/A")).toBe(false);
    expect(isFilledText("Coming soon")).toBe(false);
  });
});

describe("isValidLinkedInUrl", () => {
  it("accepts valid LinkedIn URLs and rejects others", () => {
    expect(isValidLinkedInUrl("https://www.linkedin.com/in/ada")).toBe(true);
    expect(isValidLinkedInUrl("https://example.com/in/ada")).toBe(false);
    expect(isValidLinkedInUrl("not-a-url")).toBe(false);
  });
});

describe("isBusinessApplicable", () => {
  it("applies for links or entrepreneur situation only", () => {
    expect(isBusinessApplicable({ professionalSituation: "Employee", businessLinkCount: 0 })).toBe(false);
    expect(isBusinessApplicable({ professionalSituation: "Employee", businessLinkCount: 1 })).toBe(true);
    expect(
      isBusinessApplicable({
        professionalSituation: "Entrepreneur / business owner",
        businessLinkCount: 0,
      }),
    ).toBe(true);
  });
});

describe("calculateProfileCompletion", () => {
  it("returns 0 for an empty profile and excludes Business", () => {
    const result = calculateProfileCompletion(emptyProfile());
    expect(result.percent).toBe(0);
    expect(result.businessApplicable).toBe(false);
    expect(result.headshotDeferred).toBe(true);
    expect(result.sections.every((s) => s.id !== "business")).toBe(true);
    expect(result.sections.find((s) => s.id === "about")!.fields.some((f) => f.key === "headshot")).toBe(
      false,
    );
  });

  it("does not count missing headshot against completion", () => {
    const without = calculateProfileCompletion(fullNonBusiness());
    const withShot = calculateProfileCompletion({ ...fullNonBusiness(), hasHeadshot: true });
    expect(without.percent).toBe(100);
    expect(withShot.percent).toBe(100);
  });

  it("does not treat organisation/workplace as industry", () => {
    const result = calculateProfileCompletion(
      emptyProfile({
        displayName: "Ola",
        profession: "Engineer",
        industryName: null,
      }),
    );
    const industry = result.sections.find((s) => s.id === "professional")!.fields.find((f) => f.key === "industry")!;
    expect(industry.complete).toBe(false);
    expect(industry.label).toBe("Industry");
  });

  it("reaches 100% for a fully completed non-business profile", () => {
    expect(calculateProfileCompletion(fullNonBusiness()).percent).toBe(100);
  });

  it("includes Business denominator for entrepreneurs without links", () => {
    const result = calculateProfileCompletion({
      ...fullNonBusiness(),
      professionalSituation: "Entrepreneur / business owner",
      businessLinks: [],
    });
    expect(result.businessApplicable).toBe(true);
    expect(result.percent).toBeLessThan(100);
  });

  it("reaches 100% for business members with linked detail", () => {
    const result = calculateProfileCompletion({
      ...fullNonBusiness(),
      professionalSituation: "Entrepreneur / business owner",
      businessLinks: [{ name: "Ada Labs", industryName: "Technology", description: null }],
    });
    expect(result.percent).toBe(100);
  });

  it("does not count unset opportunity preferences as complete", () => {
    const result = calculateProfileCompletion(
      emptyProfile({
        lookingForSummary: "Peers",
        offeringSummary: "Help",
        opportunityPreferences: { collaboration: null, mentorship: null },
      }),
    );
    const opp = result.sections.find((s) => s.id === "opportunities")!;
    expect(opp.fields.find((f) => f.key === "collaboration")!.complete).toBe(false);
    expect(opp.fields.find((f) => f.key === "mentorship")!.complete).toBe(false);
  });

  it("counts explicit No as a set preference", () => {
    const result = calculateProfileCompletion(
      emptyProfile({
        opportunityPreferences: { mentorship: false },
      }),
    );
    expect(
      result.sections.find((s) => s.id === "opportunities")!.fields.find((f) => f.key === "mentorship")!
        .complete,
    ).toBe(true);
  });

  it("keeps percent in 0–100 and is deterministic", () => {
    const a = calculateProfileCompletion(fullNonBusiness());
    const b = calculateProfileCompletion(fullNonBusiness());
    expect(a).toEqual(b);
    expect(a.percent).toBeGreaterThanOrEqual(0);
    expect(a.percent).toBeLessThanOrEqual(100);
  });

  it("does not decrease when adding valid information (same applicability)", () => {
    let current = emptyProfile({
      displayName: "Ola",
      profession: "Engineer",
      lookingForSummary: "Peers",
      offeringSummary: "Help",
    });
    let percent = calculateProfileCompletion(current).percent;
    const additions: Partial<ProfileCompletionInput>[] = [
      { location: "Lagos" },
      { bio: "Builder" },
      { industryName: "Technology" },
      { yearsExperience: 3 },
      { skillNames: ["Go"] },
      { serviceNames: ["Teaching"] },
      { linkedinUrl: "https://linkedin.com/in/ola" },
      { serviceArea: "Media" },
      {
        opportunityPreferences: {
          collaboration: true,
          mentorship: false,
          referrals: true,
          training: false,
        },
      },
    ];
    for (const addition of additions) {
      current = { ...current, ...addition };
      const next = calculateProfileCompletion(current).percent;
      expect(next).toBeGreaterThanOrEqual(percent);
      percent = next;
    }
  });

  it("does not increase when removing completed information", () => {
    const full = fullNonBusiness();
    const reduced = calculateProfileCompletion({ ...full, bio: null, industryName: null });
    expect(reduced.percent).toBeLessThan(calculateProfileCompletion(full).percent);
  });
});
