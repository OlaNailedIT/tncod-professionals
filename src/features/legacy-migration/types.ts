export const AUTHORITATIVE_SHEET = "Form responses 1" as const;
export const REJECTED_SHEETS = ["Spotlight Queue", "Dashboard"] as const;

export const LEGACY_SOURCE = "GOOGLE_FORM" as const;

export type ProposedAction =
  | "CREATE"
  | "GAP_ONLY"
  | "MATCH_EXISTING"
  | "SKIP_ALREADY_IMPORTED"
  | "AMBIGUOUS"
  | "INVALID"
  | "MANUAL_REVIEW";

export type IdentityClassification =
  | "LIKELY_NEW_MEMBER"
  | "MATCHED_TO_EXISTING_MEMBER"
  | "DUPLICATE_WITHIN_LEGACY_SOURCE"
  | "AMBIGUOUS_IDENTITY"
  | "CONFLICTING_IDENTITY"
  | "UNMATCHABLE"
  | "ALREADY_IMPORTED";

export type LinkedInClass = "VALID_URL" | "NORMALIZABLE_URL" | "INVALID_JUNK" | "MISSING";

export type CanonicalLegacyRow = {
  sourceRowNumber: number;
  /** Raw collector email (pre-normalize). */
  emailRaw: string;
  emailNormalized: string | null;
  fullName: string;
  preferredName: string | null;
  phoneRaw: string;
  phoneNormalized: string | null;
  linkedinRaw: string | null;
  linkedinClass: LinkedInClass;
  linkedinUrl: string | null;
  categoryRaw: string | null;
  professionalSituation: string | null;
  jobTitle: string | null;
  industryRaw: string | null;
  organisationRaw: string | null;
  yearsBucket: string | null;
  servicesRaw: string | null;
  skillsRaw: string | null;
  bioRaw: string | null;
  churchDepartment: string | null;
  referrals: boolean | null;
  collaboration: boolean | null;
  mentorship: boolean | null;
  spotlightInterestRaw: string | null;
  spotlightInterest: boolean | null;
  businessName: string | null;
  directoryConsentRaw: string | null;
  whatsappConsentRaw: string | null;
  /** Fields retained only as historical metadata — never current platform state. */
  historicalOnly: Record<string, string | null>;
};

export type MappedLegacyPayload = {
  displayName: string;
  email: string;
  phone: string | null;
  professionalSituation: string | null;
  profession: string | null;
  organisationName: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  serviceArea: string | null;
  opportunityPreferences: {
    referrals: boolean | null;
    collaboration: boolean | null;
    mentorship: boolean | null;
    training: boolean | null;
  };
  spotlightInterest: boolean;
  /** Explicit platform baseline — never derived from historical consent/verification. */
  profileStatus: "INCOMPLETE";
  verificationStatus: "NOT_REVIEWED";
  visibilityStatus: "PRIVATE";
  legacyImport: true;
  legacySource: typeof LEGACY_SOURCE;
  yearsExperience: null;
  industryId: null;
  skillIds: [];
  serviceIds: [];
  createBusiness: false;
  createConsent: false;
  createSpotlightRecord: false;
};

export type ExistingMemberHit = {
  userId: string;
  profileId: string;
  email: string;
  phone: string | null;
  matchedBy: "email" | "phone" | "both";
};

export type RowDryRunResult = {
  sourceRowNumber: number;
  sourceRowHash: string;
  emailFingerprint: string | null;
  phoneNormalized: string | null;
  classification: IdentityClassification;
  proposedAction: ProposedAction;
  warnings: string[];
  manualReviewReason: string | null;
  maskedPreview: {
    displayName: string;
    email: string | null;
    phone: string | null;
    situation: string | null;
    hasBusinessCandidate: boolean;
  };
  mapped: MappedLegacyPayload | null;
  excludedFromCurrentState: string[];
};
