/**
 * Phase 17 — pure deterministic matching rules.
 * No AI. No percentages. Explainable dimension results.
 */

export type DimensionStatus = "MATCH" | "NO_MATCH" | "NOT_REQUIRED" | "INSUFFICIENT_DATA";

export type MatchDimensionKey =
  | "profession"
  | "location"
  | "experience"
  | "workType"
  | "skills"
  | "availability";

export type DimensionResult = {
  key: MatchDimensionKey;
  status: DimensionStatus;
  detail: string;
};

export type MatchOutcome = "POTENTIAL_MATCH" | "NO_MATCH" | "INSUFFICIENT_DATA";

export type OpportunityRequirements = {
  requiredProfession: string | null;
  locationPreference: string | null;
  minYearsExperience: number | null;
  employmentType: string | null;
  /** Required skill IDs — ALL must be present for skills MATCH. */
  requiredSkillIds: string[];
  /**
   * Free-text availability is not structured on the professional side.
   * When set, availability dimension is INSUFFICIENT_DATA (honest gap).
   * Prefer leaving unset until a structured availability field exists.
   */
  availability: string | null;
};

export type ProfessionalMatchInput = {
  profileId: string;
  profession: string | null;
  location: string | null;
  yearsExperience: number | null;
  skillIds: string[];
  /** Employment types observed on experience rows (structured). */
  experienceEmploymentTypes: string[];
};

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function evaluateProfession(
  required: string | null,
  profession: string | null,
): DimensionResult {
  if (!required || !norm(required)) {
    return { key: "profession", status: "NOT_REQUIRED", detail: "No profession requirement" };
  }
  if (!profession || !norm(profession)) {
    return {
      key: "profession",
      status: "INSUFFICIENT_DATA",
      detail: "Professional profession is missing",
    };
  }
  const ok = norm(profession) === norm(required);
  return {
    key: "profession",
    status: ok ? "MATCH" : "NO_MATCH",
    detail: ok
      ? "Profession matches requirement"
      : `Profession “${profession}” does not match “${required}”`,
  };
}

export function evaluateLocation(
  required: string | null,
  location: string | null,
): DimensionResult {
  if (!required || !norm(required)) {
    return { key: "location", status: "NOT_REQUIRED", detail: "No location requirement" };
  }
  if (!location || !norm(location)) {
    return {
      key: "location",
      status: "INSUFFICIENT_DATA",
      detail: "Professional location is missing",
    };
  }
  const req = norm(required);
  const loc = norm(location);
  const ok = loc === req || loc.includes(req) || req.includes(loc);
  return {
    key: "location",
    status: ok ? "MATCH" : "NO_MATCH",
    detail: ok
      ? "Location is compatible with requirement"
      : `Location “${location}” does not match “${required}”`,
  };
}

export function evaluateExperience(
  minYears: number | null,
  years: number | null,
): DimensionResult {
  if (minYears == null || !Number.isFinite(minYears)) {
    return { key: "experience", status: "NOT_REQUIRED", detail: "No experience requirement" };
  }
  if (years == null || !Number.isFinite(years)) {
    return {
      key: "experience",
      status: "INSUFFICIENT_DATA",
      detail: "Professional years of experience is missing",
    };
  }
  const ok = years >= minYears;
  return {
    key: "experience",
    status: ok ? "MATCH" : "NO_MATCH",
    detail: ok
      ? `${years} years meets minimum ${minYears}`
      : `${years} years is below minimum ${minYears}`,
  };
}

/**
 * Work type uses Opportunity.employmentType vs Experience.employmentType values.
 * RemotePreference is deferred until professionals have a structured remote field.
 */
export function evaluateWorkType(
  requiredEmploymentType: string | null,
  experienceEmploymentTypes: string[],
): DimensionResult {
  if (!requiredEmploymentType) {
    return { key: "workType", status: "NOT_REQUIRED", detail: "No work-type requirement" };
  }
  if (experienceEmploymentTypes.length === 0) {
    return {
      key: "workType",
      status: "INSUFFICIENT_DATA",
      detail: "No structured employment-type experience records",
    };
  }
  const ok = experienceEmploymentTypes.includes(requiredEmploymentType);
  return {
    key: "workType",
    status: ok ? "MATCH" : "NO_MATCH",
    detail: ok
      ? `Experience includes ${requiredEmploymentType}`
      : `No experience with employment type ${requiredEmploymentType}`,
  };
}

/** ALL required skill IDs must be present. */
export function evaluateSkills(
  requiredSkillIds: string[],
  professionalSkillIds: string[],
): DimensionResult {
  if (requiredSkillIds.length === 0) {
    return { key: "skills", status: "NOT_REQUIRED", detail: "No required skills" };
  }
  if (professionalSkillIds.length === 0) {
    return {
      key: "skills",
      status: "INSUFFICIENT_DATA",
      detail: "Professional has no structured skills",
    };
  }
  const have = new Set(professionalSkillIds);
  const matched = requiredSkillIds.filter((id) => have.has(id));
  const ok = matched.length === requiredSkillIds.length;
  return {
    key: "skills",
    status: ok ? "MATCH" : "NO_MATCH",
    detail: ok
      ? `All ${requiredSkillIds.length} required skills present`
      : `${matched.length} of ${requiredSkillIds.length} required skills present`,
  };
}

/**
 * Availability: free-text on opportunity with no structured professional field.
 * Unset → NOT_REQUIRED. Set → INSUFFICIENT_DATA (do not invent).
 */
export function evaluateAvailability(availability: string | null): DimensionResult {
  if (!availability || !norm(availability)) {
    return { key: "availability", status: "NOT_REQUIRED", detail: "No availability requirement" };
  }
  return {
    key: "availability",
    status: "INSUFFICIENT_DATA",
    detail: "Structured professional availability is not available for matching",
  };
}

export function evaluateAllDimensions(
  opportunity: OpportunityRequirements,
  professional: ProfessionalMatchInput,
): DimensionResult[] {
  return [
    evaluateProfession(opportunity.requiredProfession, professional.profession),
    evaluateLocation(opportunity.locationPreference, professional.location),
    evaluateExperience(opportunity.minYearsExperience, professional.yearsExperience),
    evaluateWorkType(opportunity.employmentType, professional.experienceEmploymentTypes),
    evaluateSkills(opportunity.requiredSkillIds, professional.skillIds),
    evaluateAvailability(opportunity.availability),
  ];
}

/**
 * POTENTIAL_MATCH: no NO_MATCH, no INSUFFICIENT_DATA, and at least one MATCH
 *   OR all dimensions NOT_REQUIRED (open opportunity with no criteria → not a useful match list).
 * If all NOT_REQUIRED: INSUFFICIENT_DATA at opportunity level (no criteria to match).
 * NO_MATCH if any dimension NO_MATCH.
 * INSUFFICIENT_DATA if any INSUFFICIENT and no NO_MATCH.
 */
export function classifyMatch(dimensions: DimensionResult[]): MatchOutcome {
  if (dimensions.some((d) => d.status === "NO_MATCH")) return "NO_MATCH";
  if (dimensions.some((d) => d.status === "INSUFFICIENT_DATA")) return "INSUFFICIENT_DATA";
  if (dimensions.every((d) => d.status === "NOT_REQUIRED")) return "INSUFFICIENT_DATA";
  if (dimensions.some((d) => d.status === "MATCH")) return "POTENTIAL_MATCH";
  return "INSUFFICIENT_DATA";
}

export function isPotentialMatch(dimensions: DimensionResult[]): boolean {
  return classifyMatch(dimensions) === "POTENTIAL_MATCH";
}
