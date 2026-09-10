import { isValidLinkedInUrl } from "@/features/profile/completion";
import { normalizePhone } from "@/features/registration/phone";
import type {
  CanonicalLegacyRow,
  LinkedInClass,
  MappedLegacyPayload,
} from "@/features/legacy-migration/types";
import { LEGACY_SOURCE } from "@/features/legacy-migration/types";

export const SITUATION_MAP: Record<string, string> = {
  "employee / corporate professional": "Employee",
  "entrepreneur / business owner": "Entrepreneur / business owner",
  "student / entry-level professional": "Student / intern",
  other: "Other",
};

export function normalizeEmail(value: string): string | null {
  const e = value.trim().toLowerCase();
  if (!e) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

export function classifyLinkedIn(raw: string | null | undefined): {
  class: LinkedInClass;
  url: string | null;
} {
  if (!raw || !raw.trim()) return { class: "MISSING", url: null };
  const v = raw.trim();
  if (/^(n\/?a|nil|none|skip|i don.?t have.*)$/i.test(v)) {
    return { class: "INVALID_JUNK", url: null };
  }
  let candidate = v;
  if (!/^https?:\/\//i.test(candidate) && /linkedin\.com/i.test(candidate)) {
    candidate = `https://${candidate.replace(/^\/\//, "")}`;
  }
  if (isValidLinkedInUrl(candidate)) {
    return {
      class: /^https?:\/\//i.test(v) ? "VALID_URL" : "NORMALIZABLE_URL",
      url: candidate,
    };
  }
  return { class: "INVALID_JUNK", url: null };
}

export function mapSituation(raw: string | null): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return SITUATION_MAP[key] ?? null;
}

export function yesNoToBool(raw: string | null | undefined): boolean | null {
  if (!raw || !raw.trim()) return null;
  const v = raw.trim().toLowerCase();
  if (v === "yes") return true;
  if (v === "no") return false;
  return null;
}

export function displayNameFrom(fullName: string, preferredName: string | null): string {
  const preferred = preferredName?.trim();
  if (preferred) return preferred.replace(/\s+/g, " ");
  return fullName.trim().replace(/\s+/g, " ");
}

/**
 * Build mapped payload for current platform fields.
 * Never sets VERIFIED / DIRECTORY / consents / business / Spotlight records.
 * yearsExperience left null — buckets are not precise integers.
 */
export function mapToPlatformPayload(row: CanonicalLegacyRow): {
  mapped: MappedLegacyPayload | null;
  warnings: string[];
  manualReviewReasons: string[];
  excludedFromCurrentState: string[];
} {
  const warnings: string[] = [];
  const manualReviewReasons: string[] = [];
  const excludedFromCurrentState = [
    "Gender",
    "Birthday",
    "Email Address (blank question column)",
    "Directory consent → not consents / not DIRECTORY",
    "WhatsApp consent → not consents",
    "Spotlight Status / Date Featured → not Phase 15 Spotlight",
    "Drive photo / CAC / company profile uploads",
    "Years bucket → years_experience left null",
    "Industry free-text → no auto industry_id",
    "Skills/services free-text → no auto taxonomy upsert",
    "Business Name → no auto business / OWNER",
  ];

  if (!row.emailNormalized) {
    return {
      mapped: null,
      warnings,
      manualReviewReasons: ["Missing or invalid email"],
      excludedFromCurrentState,
    };
  }
  if (!row.fullName.trim()) {
    return {
      mapped: null,
      warnings,
      manualReviewReasons: ["Missing full name"],
      excludedFromCurrentState,
    };
  }
  if (!row.phoneNormalized) {
    manualReviewReasons.push("Phone could not be normalized under NG rules");
  }

  const situation = row.professionalSituation;
  if (row.categoryRaw && !situation) {
    manualReviewReasons.push(`Unmapped professional category: ${row.categoryRaw}`);
  }

  if (row.industryRaw) {
    manualReviewReasons.push("Industry free-text requires controlled vocabulary review");
  }
  if (row.skillsRaw) {
    manualReviewReasons.push("Skills free-text requires controlled vocabulary review");
  }
  if (row.businessName) {
    manualReviewReasons.push("Business candidate — no automatic business/OWNER creation");
  }
  if (row.yearsBucket) {
    warnings.push(`Years bucket retained as historical only: ${row.yearsBucket}`);
  }
  if (row.linkedinClass === "INVALID_JUNK") {
    warnings.push("LinkedIn value discarded as junk");
  }

  // Historical consent must never become current consent / publication.
  if (row.directoryConsentRaw) {
    warnings.push("Historical directory consent ignored for current platform state");
  }
  if (row.whatsappConsentRaw) {
    warnings.push("Historical WhatsApp consent ignored for current platform state");
  }

  const mapped: MappedLegacyPayload = {
    displayName: displayNameFrom(row.fullName, row.preferredName),
    email: row.emailNormalized,
    phone: row.phoneNormalized,
    professionalSituation: situation,
    profession: row.jobTitle?.trim() || null,
    organisationName: row.organisationRaw?.trim() || null,
    bio: row.bioRaw?.trim() || null,
    linkedinUrl: row.linkedinUrl,
    serviceArea: row.churchDepartment?.trim() || null,
    opportunityPreferences: {
      referrals: row.referrals,
      collaboration: row.collaboration,
      mentorship: row.mentorship,
      training: null,
    },
    spotlightInterest: row.spotlightInterest === true,
    profileStatus: "INCOMPLETE",
    verificationStatus: "NOT_REVIEWED",
    visibilityStatus: "PRIVATE",
    legacyImport: true,
    legacySource: LEGACY_SOURCE,
    yearsExperience: null,
    industryId: null,
    skillIds: [],
    serviceIds: [],
    createBusiness: false,
    createConsent: false,
    createSpotlightRecord: false,
  };

  return { mapped, warnings, manualReviewReasons, excludedFromCurrentState };
}

/** Apply phone + email + linkedin + situation transforms onto a partially filled row. */
export function finalizeCanonicalRow(
  partial: Omit<
    CanonicalLegacyRow,
    | "emailNormalized"
    | "phoneNormalized"
    | "linkedinClass"
    | "linkedinUrl"
    | "professionalSituation"
    | "referrals"
    | "collaboration"
    | "mentorship"
    | "spotlightInterest"
  > & {
    referralsRaw?: string | null;
    collaborationRaw?: string | null;
    mentorshipRaw?: string | null;
  },
): CanonicalLegacyRow {
  const li = classifyLinkedIn(partial.linkedinRaw);
  return {
    ...partial,
    emailNormalized: normalizeEmail(partial.emailRaw),
    phoneNormalized: normalizePhone(partial.phoneRaw),
    linkedinClass: li.class,
    linkedinUrl: li.url,
    professionalSituation: mapSituation(partial.categoryRaw),
    referrals: yesNoToBool(partial.referralsRaw ?? null),
    collaboration: yesNoToBool(partial.collaborationRaw ?? null),
    mentorship: yesNoToBool(partial.mentorshipRaw ?? null),
    spotlightInterest: yesNoToBool(partial.spotlightInterestRaw),
  };
}
