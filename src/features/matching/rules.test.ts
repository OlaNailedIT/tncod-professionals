import { describe, expect, it } from "vitest";
import {
  classifyMatch,
  evaluateAllDimensions,
  evaluateAvailability,
  evaluateExperience,
  evaluateLocation,
  evaluateProfession,
  evaluateSkills,
  evaluateWorkType,
  isPotentialMatch,
  type OpportunityRequirements,
  type ProfessionalMatchInput,
} from "@/features/matching/rules";
import {
  assertMatchProjection,
  MATCH_FORBIDDEN_KEYS,
} from "@/features/matching/projection";

const baseOpp = (): OpportunityRequirements => ({
  requiredProfession: null,
  locationPreference: null,
  minYearsExperience: null,
  employmentType: null,
  requiredSkillIds: [],
  availability: null,
});

const basePro = (id = "p1"): ProfessionalMatchInput => ({
  profileId: id,
  profession: null,
  location: null,
  yearsExperience: null,
  skillIds: [],
  experienceEmploymentTypes: [],
});

describe("Phase 17 deterministic matching rules", () => {
  it("profession match / mismatch / insufficient", () => {
    expect(evaluateProfession("Engineer", "Engineer").status).toBe("MATCH");
    expect(evaluateProfession("Engineer", "  engineer ").status).toBe("MATCH");
    expect(evaluateProfession("Engineer", "Designer").status).toBe("NO_MATCH");
    expect(evaluateProfession("Engineer", null).status).toBe("INSUFFICIENT_DATA");
    expect(evaluateProfession(null, "Engineer").status).toBe("NOT_REQUIRED");
  });

  it("location match / mismatch / insufficient", () => {
    expect(evaluateLocation("Cape Town", "Cape Town").status).toBe("MATCH");
    expect(evaluateLocation("Cape Town", "Cape Town, South Africa").status).toBe("MATCH");
    expect(evaluateLocation("Johannesburg", "Cape Town").status).toBe("NO_MATCH");
    expect(evaluateLocation("Cape Town", null).status).toBe("INSUFFICIENT_DATA");
  });

  it("experience meets / below / insufficient", () => {
    expect(evaluateExperience(5, 7).status).toBe("MATCH");
    expect(evaluateExperience(5, 5).status).toBe("MATCH");
    expect(evaluateExperience(5, 3).status).toBe("NO_MATCH");
    expect(evaluateExperience(5, null).status).toBe("INSUFFICIENT_DATA");
    expect(evaluateExperience(null, 10).status).toBe("NOT_REQUIRED");
  });

  it("work type compatible / incompatible / insufficient", () => {
    expect(evaluateWorkType("FULL_TIME", ["FULL_TIME", "CONTRACT"]).status).toBe("MATCH");
    expect(evaluateWorkType("FULL_TIME", ["PART_TIME"]).status).toBe("NO_MATCH");
    expect(evaluateWorkType("FULL_TIME", []).status).toBe("INSUFFICIENT_DATA");
    expect(evaluateWorkType(null, ["FULL_TIME"]).status).toBe("NOT_REQUIRED");
  });

  it("skills ALL required — full / partial / none / insufficient", () => {
    expect(evaluateSkills(["a", "b"], ["a", "b", "c"]).status).toBe("MATCH");
    expect(evaluateSkills(["a", "b"], ["a"]).status).toBe("NO_MATCH");
    expect(evaluateSkills(["a", "b"], ["a"]).detail).toMatch(/1 of 2/);
    expect(evaluateSkills(["a"], []).status).toBe("INSUFFICIENT_DATA");
    expect(evaluateSkills([], ["a"]).status).toBe("NOT_REQUIRED");
  });

  it("availability unset NOT_REQUIRED; set INSUFFICIENT_DATA (honest gap)", () => {
    expect(evaluateAvailability(null).status).toBe("NOT_REQUIRED");
    expect(evaluateAvailability("Immediate").status).toBe("INSUFFICIENT_DATA");
  });

  it("full potential match combination", () => {
    const dims = evaluateAllDimensions(
      {
        requiredProfession: "Engineer",
        locationPreference: "Cape Town",
        minYearsExperience: 5,
        employmentType: "FULL_TIME",
        requiredSkillIds: ["s1", "s2"],
        availability: null,
      },
      {
        profileId: "p",
        profession: "Engineer",
        location: "Cape Town",
        yearsExperience: 7,
        skillIds: ["s1", "s2", "s3"],
        experienceEmploymentTypes: ["FULL_TIME"],
      },
    );
    expect(classifyMatch(dims)).toBe("POTENTIAL_MATCH");
    expect(isPotentialMatch(dims)).toBe(true);
  });

  it("experience below requirement → NO_MATCH even if other dims match", () => {
    const dims = evaluateAllDimensions(
      {
        ...baseOpp(),
        requiredProfession: "Engineer",
        locationPreference: "Cape Town",
        minYearsExperience: 10,
        requiredSkillIds: ["s1"],
      },
      {
        ...basePro(),
        profession: "Engineer",
        location: "Cape Town",
        yearsExperience: 3,
        skillIds: ["s1"],
      },
    );
    expect(classifyMatch(dims)).toBe("NO_MATCH");
  });

  it("missing professional data → INSUFFICIENT_DATA", () => {
    const dims = evaluateAllDimensions(
      { ...baseOpp(), requiredProfession: "Engineer" },
      basePro(),
    );
    expect(classifyMatch(dims)).toBe("INSUFFICIENT_DATA");
  });

  it("no criteria → INSUFFICIENT_DATA classification", () => {
    const dims = evaluateAllDimensions(baseOpp(), {
      ...basePro(),
      profession: "Engineer",
    });
    expect(classifyMatch(dims)).toBe("INSUFFICIENT_DATA");
  });

  it("safe projection rejects private fields", () => {
    const good = {
      profileId: "p",
      displayName: "A",
      profession: null,
      location: null,
      yearsExperience: null,
      skillNames: [] as string[],
      verificationStatus: "VERIFIED",
      outcome: "POTENTIAL_MATCH" as const,
      dimensions: [] as [],
    };
    expect(() => assertMatchProjection(good)).not.toThrow();
    for (const key of MATCH_FORBIDDEN_KEYS) {
      expect(() => assertMatchProjection({ ...good, [key]: "leak" })).toThrow(/forbidden/);
    }
  });
});
