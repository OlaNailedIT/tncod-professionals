/**
 * EXCO Spotlight presentation — allowlisted fields only.
 * No contact, business, documents, community, or internal IDs.
 */
export type SpotlightProfessionalProjection = {
  profileId: string;
  displayName: string;
  headline: string | null;
  location: string | null;
  bio: string | null;
  profession: string | null;
  professionalTitle: string | null;
  industryName: string | null;
  skillNames: string[];
  serviceNames: string[];
  linkedinUrl: string | null;
  websiteUrl: string | null;
  hasHeadshot: boolean;
  /** Presence signal only — never expose storage key. */
  verificationStatus: string;
  visibilityStatus: string;
  spotlightInterest: boolean;
  completionPercent: number;
  eligibility: {
    eligible: boolean;
    interest: boolean;
    profileComplete: boolean;
    headshotAvailable: boolean;
    verified: boolean;
  };
};

export type SpotlightRecordProjection = {
  id: string;
  profileId: string;
  status: string;
  title: string;
  description: string | null;
  createdAt: string;
  publishedAt: string | null;
  createdById: string;
  professional: SpotlightProfessionalProjection;
  currentlyEligible: boolean;
};

export const SPOTLIGHT_FORBIDDEN_KEYS = [
  "email",
  "phone",
  "storageKey",
  "storage_key",
  "profileImageStorageKey",
  "churchServiceArea",
  "serviceArea",
  "business",
  "businesses",
  "documents",
  "consent",
] as const;

export function assertSpotlightProfessionalProjection(
  value: unknown,
): asserts value is SpotlightProfessionalProjection {
  if (!value || typeof value !== "object") {
    throw new Error("SpotlightProfessionalProjection must be an object");
  }
  const obj = value as Record<string, unknown>;
  for (const forbidden of SPOTLIGHT_FORBIDDEN_KEYS) {
    if (forbidden in obj) {
      throw new Error(`Spotlight projection leaked forbidden field: ${forbidden}`);
    }
  }
}
