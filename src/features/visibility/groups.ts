/**
 * Phase 14 — authoritative field-group visibility matrix (server).
 * Preference levels: PRIVATE | MEMBERS | PUBLIC
 * UX labels: Private | TNCOD members | Public directory
 */

export const VISIBILITY_GROUP_KEYS = [
  "identity",
  "about",
  "professional",
  "skills_services",
  "location",
  "contact",
  "links",
  "community",
  "opportunities",
  "business",
] as const;

export type VisibilityGroupKey = (typeof VISIBILITY_GROUP_KEYS)[number];

export const VISIBILITY_PREFERENCE_LEVELS = ["PRIVATE", "MEMBERS", "PUBLIC"] as const;
export type VisibilityPreferenceLevelValue = (typeof VISIBILITY_PREFERENCE_LEVELS)[number];

export type VisibilityGroupControl = "member" | "fixed_private" | "system" | "deferred";

export type VisibilityGroupDefinition = {
  key: VisibilityGroupKey;
  label: string;
  description: string;
  control: VisibilityGroupControl;
  allowedLevels: readonly VisibilityPreferenceLevelValue[];
  defaultPreference: VisibilityPreferenceLevelValue;
  /** Phase 13 PublicProfessional fields withheld when preference ≠ PUBLIC */
  publicFields: readonly string[];
};

export const VISIBILITY_GROUPS: readonly VisibilityGroupDefinition[] = [
  {
    key: "identity",
    label: "Identity",
    description: "Your display name, headline, and professional title.",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS", "PUBLIC"],
    defaultPreference: "PUBLIC",
    publicFields: ["displayName", "headline", "professionalTitle"],
  },
  {
    key: "professional",
    label: "Professional information",
    description: "Profession and industry. Years of experience and organisation stay out of the public directory.",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS", "PUBLIC"],
    defaultPreference: "PUBLIC",
    publicFields: ["profession", "industryName"],
  },
  {
    key: "skills_services",
    label: "Skills and services",
    description: "Skills and services shown on your directory listing when eligible.",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS", "PUBLIC"],
    defaultPreference: "PUBLIC",
    publicFields: ["skillNames", "serviceNames"],
  },
  {
    key: "location",
    label: "Location",
    description: "City or region style location (not a street address).",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS", "PUBLIC"],
    defaultPreference: "PUBLIC",
    publicFields: ["location"],
  },
  {
    key: "about",
    label: "About",
    description: "Bio and professional summary. Not shown in the public directory in this version.",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS"],
    defaultPreference: "PRIVATE",
    publicFields: [],
  },
  {
    key: "links",
    label: "Professional links",
    description: "LinkedIn and website. Not shown in the public directory in this version.",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS"],
    defaultPreference: "PRIVATE",
    publicFields: [],
  },
  {
    key: "opportunities",
    label: "Opportunity preferences",
    description: "What you are seeking or offering. Not directory identity and never public here.",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS"],
    defaultPreference: "PRIVATE",
    publicFields: [],
  },
  {
    key: "business",
    label: "Business affiliation",
    description: "Linked businesses. Public business directory is not available in this version.",
    control: "member",
    allowedLevels: ["PRIVATE", "MEMBERS"],
    defaultPreference: "PRIVATE",
    publicFields: [],
  },
  {
    key: "contact",
    label: "Contact information",
    description: "Email and phone stay private. There is no public or member directory contact option.",
    control: "fixed_private",
    allowedLevels: ["PRIVATE"],
    defaultPreference: "PRIVATE",
    publicFields: [],
  },
  {
    key: "community",
    label: "Community",
    description: "Service area and community context stay private.",
    control: "fixed_private",
    allowedLevels: ["PRIVATE"],
    defaultPreference: "PRIVATE",
    publicFields: [],
  },
] as const;

export const SYSTEM_CONTROLLED_NOTES = [
  "Verification status",
  "Directory publication state",
  "Public profile address (slug)",
  "Documents and uploads",
  "Internal identifiers and audit records",
] as const;

export const UX_PREFERENCE_LABELS: Record<VisibilityPreferenceLevelValue, string> = {
  PRIVATE: "Private",
  MEMBERS: "TNCOD members",
  PUBLIC: "Public directory",
};

export const UX_PREFERENCE_HELP: Record<VisibilityPreferenceLevelValue, string> = {
  PRIVATE: "Only you and people with appropriate administrative access can see this.",
  MEMBERS:
    "Visible to signed-in TNCOD Professionals members where the platform allows it. This does not expand the public directory by itself.",
  PUBLIC:
    "May appear on the public Professionals Directory when your profile is eligible and the platform permits that information to be shown.",
};

export function isVisibilityGroupKey(value: string): value is VisibilityGroupKey {
  return (VISIBILITY_GROUP_KEYS as readonly string[]).includes(value);
}

export function getVisibilityGroup(key: VisibilityGroupKey): VisibilityGroupDefinition {
  const found = VISIBILITY_GROUPS.find((g) => g.key === key);
  if (!found) throw new Error(`Unknown visibility group: ${key}`);
  return found;
}

export function defaultPreferenceMap(): Record<VisibilityGroupKey, VisibilityPreferenceLevelValue> {
  const out = {} as Record<VisibilityGroupKey, VisibilityPreferenceLevelValue>;
  for (const g of VISIBILITY_GROUPS) {
    out[g.key] = g.defaultPreference;
  }
  return out;
}

export function isLevelAllowedForGroup(
  groupKey: VisibilityGroupKey,
  level: VisibilityPreferenceLevelValue,
): boolean {
  return getVisibilityGroup(groupKey).allowedLevels.includes(level);
}

/** Directory public exposure requires PUBLIC preference (MEMBERS does not expand Phase 13 V1). */
export function preferenceAllowsPublicDirectory(
  level: VisibilityPreferenceLevelValue | undefined | null,
): boolean {
  return level === "PUBLIC";
}
