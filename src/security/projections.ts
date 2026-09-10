/**
 * Explicit API field lists. Never SELECT * for application responses.
 * PublicProfessional must match app.directory_professionals() columns.
 * Headshot URLs, if added later, are derived after listing checks — never storage_key.
 */
export const PublicProfessionalFields = [
  "publicSlug",
  "displayName",
  "headline",
  "location",
  "profession",
  "professionalTitle",
  "industryName",
  "skillNames",
  "serviceNames",
] as const;

export type PublicProfessionalField = (typeof PublicProfessionalFields)[number];

/** Serialized public directory card/detail — allowlist only. */
export type PublicProfessional = {
  publicSlug: string;
  displayName: string;
  headline: string | null;
  location: string | null;
  profession: string | null;
  professionalTitle: string | null;
  industryName: string | null;
  skillNames: string[];
  serviceNames: string[];
  /** Presentation-only; all listed records are VERIFIED+DIRECTORY. Not a filter. */
  verifiedBadge: true;
};

export const MemberProfessionalFields = [
  ...PublicProfessionalFields,
  "email",
  "phone",
  "bio",
  "professionalSituation",
  "lookingForSummary",
  "offeringSummary",
  "linkedinUrl",
  "websiteUrl",
  "profileStatus",
  "verificationStatus",
  "visibilityStatus",
] as const;

export const ExcoViewerProfessionalFields = [
  ...PublicProfessionalFields,
  "bio",
  "professionalSummary",
  "profileStatus",
  "verificationStatus",
  "visibilityStatus",
  /** Phase 11 OD-01: operational community context on EXCO record. */
  "churchServiceArea",
] as const;

export const ExcoAdminProfessionalFields = [
  ...ExcoViewerProfessionalFields,
  "churchServiceArea",
  "email",
  "phone",
] as const;

export const NEVER_IN_PUBLIC_OR_DIRECTORY = [
  "email",
  "phone",
  "storageKey",
  "storage_key",
  "profileImageStorageKey",
  "profile_image_storage_key",
  "notes",
  "adminNotes",
  "consent",
  "audit",
  "churchInformation",
  "serviceArea",
  "id",
  "userId",
  "profileId",
  "clarificationMessage",
  "verificationStatus",
  "visibilityStatus",
  "profileStatus",
  "opportunityPreferences",
  "roles",
] as const;

export function assertPublicProfessionalShape(value: unknown): asserts value is PublicProfessional {
  if (!value || typeof value !== "object") {
    throw new Error("PublicProfessional must be an object");
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (key === "verifiedBadge") continue;
    if (!(PublicProfessionalFields as readonly string[]).includes(key)) {
      throw new Error(`PublicProfessional leaked unauthorized key: ${key}`);
    }
  }
  for (const forbidden of NEVER_IN_PUBLIC_OR_DIRECTORY) {
    if (forbidden in obj) {
      throw new Error(`PublicProfessional leaked forbidden field: ${forbidden}`);
    }
  }
}
