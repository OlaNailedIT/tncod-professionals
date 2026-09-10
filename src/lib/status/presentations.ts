import type {
  ProfileStatus,
  VerificationStatus,
  VisibilityStatus,
} from "@/types/status";
import type { StatusPresentation } from "./intents";

/**
 * Authoritative professional state → presentation.
 * Dimensions stay independent — never collapse into one “status”.
 */

const PROFILE: Record<ProfileStatus, StatusPresentation> = {
  REGISTERED: { intent: "info", label: "Registered" },
  INCOMPLETE: { intent: "warning", label: "Incomplete" },
  COMPLETE: { intent: "success", label: "Complete" },
  SUBMITTED: { intent: "info", label: "Submitted" },
};

const VERIFICATION: Record<VerificationStatus, StatusPresentation> = {
  NOT_REVIEWED: { intent: "neutral", label: "Not reviewed" },
  PENDING: { intent: "info", label: "Pending" },
  UNDER_REVIEW: { intent: "info", label: "Under review" },
  VERIFIED: { intent: "success", label: "Verified" },
  NEEDS_CLARIFICATION: { intent: "warning", label: "Needs clarification" },
  REJECTED: { intent: "danger", label: "Rejected" },
};

/** Visibility is publication/privacy — not verification success/failure. */
const VISIBILITY: Record<VisibilityStatus, StatusPresentation> = {
  PRIVATE: { intent: "neutral", label: "Private" },
  MEMBERS_ONLY: { intent: "info", label: "Members only" },
  DIRECTORY: { intent: "info", label: "Directory" },
};

export function presentProfileStatus(status: ProfileStatus): StatusPresentation {
  return PROFILE[status];
}

export function presentVerificationStatus(status: VerificationStatus): StatusPresentation {
  return VERIFICATION[status];
}

export function presentVisibilityStatus(status: VisibilityStatus): StatusPresentation {
  return VISIBILITY[status];
}

export const PROFILE_STATUS_LABELS = Object.fromEntries(
  Object.entries(PROFILE).map(([k, v]) => [k, v.label]),
) as Record<ProfileStatus, string>;

export const VERIFICATION_STATUS_LABELS = Object.fromEntries(
  Object.entries(VERIFICATION).map(([k, v]) => [k, v.label]),
) as Record<VerificationStatus, string>;

export const VISIBILITY_STATUS_LABELS = Object.fromEntries(
  Object.entries(VISIBILITY).map(([k, v]) => [k, v.label]),
) as Record<VisibilityStatus, string>;
