/**
 * Phase 8 — derived profile completion (pure, deterministic).
 *
 * Completion percentage is informational only. It never mutates
 * profile_status, verification_status, or visibility_status.
 *
 * Weights (section shares of the applicable denominator):
 *   About You        20  (preferred name, location, bio — headshot deferred/excluded)
 *   Professional     30
 *   Community        15
 *   Opportunities    25
 *   Business         10  (conditional — excluded when not applicable)
 *
 * Schema mapping:
 * - Preferred name → profiles.display_name
 * - Headshot → profile_image_storage_key (display-only until upload UX exists; NOT in denominator)
 * - Industry → professional_details.industry_id (≠ organisation_name)
 * - Community areas → church_information.service_area (no separate department column — Phase 2)
 * - Opportunity prefs → looking/offering summaries + opportunity_preferences JSON
 */

export const COMPLETION_WEIGHTS = {
  about: 20,
  professional: 30,
  community: 15,
  opportunities: 25,
  business: 10,
} as const;

const PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "none",
  "tbc",
  "coming soon",
  "-",
  "--",
  "null",
  "undefined",
]);

export const OPPORTUNITY_PREF_KEYS = [
  "collaboration",
  "mentorship",
  "referrals",
  "training",
] as const;

export type OpportunityPrefKey = (typeof OPPORTUNITY_PREF_KEYS)[number];

export type OpportunityPreferences = Partial<Record<OpportunityPrefKey, boolean | null>>;

export type ProfileCompletionInput = {
  displayName: string | null;
  /** Presence only — never counted in % until members can supply a headshot. */
  hasHeadshot: boolean;
  location: string | null;
  bio: string | null;
  profession: string | null;
  industryName: string | null;
  yearsExperience: number | null;
  hasExperienceRows: boolean;
  skillNames: string[];
  serviceNames: string[];
  linkedinUrl: string | null;
  serviceArea: string | null;
  lookingForSummary: string | null;
  offeringSummary: string | null;
  opportunityPreferences: OpportunityPreferences;
  professionalSituation: string | null;
  businessLinks: Array<{
    name: string;
    industryName: string | null;
    description: string | null;
  }>;
};

export type SectionCompletion = {
  id: "about" | "professional" | "community" | "opportunities" | "business";
  title: string;
  weight: number;
  completedCount: number;
  totalCount: number;
  ratio: number;
  fields: Array<{ key: string; label: string; complete: boolean; displayValue: string | null }>;
};

export type ProfileCompletionResult = {
  percent: number;
  businessApplicable: boolean;
  /** Headshot is shown for honesty but excluded from the percentage. */
  headshotDeferred: true;
  hasHeadshot: boolean;
  sections: SectionCompletion[];
};

export function isFilledText(value: string | null | undefined): boolean {
  if (value == null) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_VALUES.has(trimmed.toLowerCase());
}

export function isValidLinkedInUrl(value: string | null | undefined): boolean {
  if (!isFilledText(value)) return false;
  try {
    const url = new URL(value!.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

export function isBusinessApplicable(input: {
  professionalSituation: string | null;
  businessLinkCount: number;
}): boolean {
  if (input.businessLinkCount > 0) return true;
  const situation = (input.professionalSituation ?? "").toLowerCase();
  return situation.includes("entrepreneur") || situation.includes("business owner");
}

export function normalizeOpportunityPreferences(raw: unknown): OpportunityPreferences {
  const out: OpportunityPreferences = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  const obj = raw as Record<string, unknown>;
  for (const key of OPPORTUNITY_PREF_KEYS) {
    const v = obj[key];
    if (v === true || v === false) out[key] = v;
    else out[key] = null;
  }
  return out;
}

export function isPreferenceSet(value: boolean | null | undefined): boolean {
  return value === true || value === false;
}

function preferenceDisplay(value: boolean | null | undefined): string | null {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return null;
}

function displayOrNull(value: string | null | undefined): string | null {
  return isFilledText(value) ? value!.trim() : null;
}

function buildSection(
  id: SectionCompletion["id"],
  title: string,
  weight: number,
  fields: SectionCompletion["fields"],
): SectionCompletion {
  const totalCount = fields.length;
  const completedCount = fields.filter((f) => f.complete).length;
  const ratio = totalCount === 0 ? 0 : completedCount / totalCount;
  return { id, title, weight, completedCount, totalCount, ratio, fields };
}

export function calculateProfileCompletion(input: ProfileCompletionInput): ProfileCompletionResult {
  const businessApplicable = isBusinessApplicable({
    professionalSituation: input.professionalSituation,
    businessLinkCount: input.businessLinks.length,
  });

  const about = buildSection("about", "About you", COMPLETION_WEIGHTS.about, [
    {
      key: "displayName",
      label: "Preferred name",
      complete: isFilledText(input.displayName),
      displayValue: displayOrNull(input.displayName),
    },
    {
      key: "location",
      label: "Location",
      complete: isFilledText(input.location),
      displayValue: displayOrNull(input.location),
    },
    {
      key: "bio",
      label: "Bio",
      complete: isFilledText(input.bio),
      displayValue: displayOrNull(input.bio),
    },
  ]);

  const hasExperience =
    (input.yearsExperience != null && Number.isFinite(input.yearsExperience) && input.yearsExperience >= 0) ||
    input.hasExperienceRows;
  const skillsComplete = input.skillNames.some((n) => isFilledText(n));
  const servicesComplete = input.serviceNames.some((n) => isFilledText(n));
  const linkedinComplete = isValidLinkedInUrl(input.linkedinUrl);

  const professional = buildSection("professional", "Professional", COMPLETION_WEIGHTS.professional, [
    {
      key: "profession",
      label: "Profession",
      complete: isFilledText(input.profession),
      displayValue: displayOrNull(input.profession),
    },
    {
      key: "industry",
      label: "Industry",
      complete: isFilledText(input.industryName),
      displayValue: displayOrNull(input.industryName),
    },
    {
      key: "experience",
      label: "Experience",
      complete: hasExperience,
      displayValue: hasExperience
        ? input.yearsExperience != null
          ? `${input.yearsExperience} year${input.yearsExperience === 1 ? "" : "s"}`
          : "Experience recorded"
        : null,
    },
    {
      key: "skills",
      label: "Skills",
      complete: skillsComplete,
      displayValue: skillsComplete ? input.skillNames.filter(isFilledText).join(", ") : null,
    },
    {
      key: "services",
      label: "Services",
      complete: servicesComplete,
      displayValue: servicesComplete ? input.serviceNames.filter(isFilledText).join(", ") : null,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      complete: linkedinComplete,
      displayValue: linkedinComplete ? input.linkedinUrl!.trim() : null,
    },
  ]);

  const community = buildSection("community", "Community", COMPLETION_WEIGHTS.community, [
    {
      key: "serviceArea",
      label: "Areas of service",
      complete: isFilledText(input.serviceArea),
      displayValue: displayOrNull(input.serviceArea),
    },
  ]);

  const prefs = normalizeOpportunityPreferences(input.opportunityPreferences);
  const opportunities = buildSection("opportunities", "Opportunities", COMPLETION_WEIGHTS.opportunities, [
    {
      key: "seeking",
      label: "Seeking",
      complete: isFilledText(input.lookingForSummary),
      displayValue: displayOrNull(input.lookingForSummary),
    },
    {
      key: "offering",
      label: "Offering",
      complete: isFilledText(input.offeringSummary),
      displayValue: displayOrNull(input.offeringSummary),
    },
    {
      key: "collaboration",
      label: "Collaboration",
      complete: isPreferenceSet(prefs.collaboration),
      displayValue: preferenceDisplay(prefs.collaboration),
    },
    {
      key: "mentorship",
      label: "Mentorship",
      complete: isPreferenceSet(prefs.mentorship),
      displayValue: preferenceDisplay(prefs.mentorship),
    },
    {
      key: "referrals",
      label: "Referrals",
      complete: isPreferenceSet(prefs.referrals),
      displayValue: preferenceDisplay(prefs.referrals),
    },
    {
      key: "training",
      label: "Training",
      complete: isPreferenceSet(prefs.training),
      displayValue: preferenceDisplay(prefs.training),
    },
  ]);

  const primaryBusiness = input.businessLinks[0] ?? null;
  const hasBusinessLink = input.businessLinks.length > 0;
  const businessDetailComplete =
    hasBusinessLink &&
    (isFilledText(primaryBusiness?.industryName) || isFilledText(primaryBusiness?.description));

  const business = buildSection("business", "Business", COMPLETION_WEIGHTS.business, [
    {
      key: "businessLink",
      label: "Linked business",
      complete: hasBusinessLink && isFilledText(primaryBusiness?.name),
      displayValue: hasBusinessLink ? displayOrNull(primaryBusiness?.name) : null,
    },
    {
      key: "businessDetail",
      label: "Industry or description",
      complete: businessDetailComplete,
      displayValue: businessDetailComplete
        ? displayOrNull(primaryBusiness?.industryName) ?? displayOrNull(primaryBusiness?.description)
        : null,
    },
  ]);

  const sections: SectionCompletion[] = [about, professional, community, opportunities];
  if (businessApplicable) {
    sections.push(business);
  }

  let earned = 0;
  let weightSum = 0;
  for (const section of sections) {
    earned += section.ratio * section.weight;
    weightSum += section.weight;
  }

  const percent =
    weightSum === 0 ? 0 : Math.min(100, Math.max(0, Math.round((earned / weightSum) * 100)));

  return {
    percent,
    businessApplicable,
    headshotDeferred: true,
    hasHeadshot: input.hasHeadshot,
    sections,
  };
}

export function toCompletionInput(profile: {
  displayName: string;
  location: string | null;
  bio: string | null;
  hasHeadshot: boolean;
  profession: string | null;
  industryName: string | null;
  yearsExperience: number | null;
  hasExperienceRows: boolean;
  skillNames: string[];
  serviceNames: string[];
  linkedinUrl: string | null;
  serviceArea: string | null;
  lookingForSummary: string | null;
  offeringSummary: string | null;
  opportunityPreferences: OpportunityPreferences;
  professionalSituation: string | null;
  businessLinks: ProfileCompletionInput["businessLinks"];
}): ProfileCompletionInput {
  return {
    displayName: profile.displayName,
    hasHeadshot: profile.hasHeadshot,
    location: profile.location,
    bio: profile.bio,
    profession: profile.profession,
    industryName: profile.industryName,
    yearsExperience: profile.yearsExperience,
    hasExperienceRows: profile.hasExperienceRows,
    skillNames: profile.skillNames,
    serviceNames: profile.serviceNames,
    linkedinUrl: profile.linkedinUrl,
    serviceArea: profile.serviceArea,
    lookingForSummary: profile.lookingForSummary,
    offeringSummary: profile.offeringSummary,
    opportunityPreferences: profile.opportunityPreferences,
    professionalSituation: profile.professionalSituation,
    businessLinks: profile.businessLinks,
  };
}
