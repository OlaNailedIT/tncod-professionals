import type { BusinessStatus } from "@prisma/client";
import type { StatusIntent } from "@/lib/status";

/**
 * Canonical DB `BusinessStatus` ↔ member-facing verification lifecycle labels.
 * Business verification ≠ professional verification ≠ directory publication.
 */
export const BUSINESS_VERIFICATION_LABELS = {
  DRAFT: "Not submitted",
  SUBMITTED: "Pending",
  PENDING_REVIEW: "Under review",
  APPROVED: "Verified",
  NEEDS_CLARIFICATION: "Needs clarification",
  REJECTED: "Rejected",
  SUSPENDED: "Suspended",
} as const satisfies Record<BusinessStatus, string>;

export type MemberFacingVerificationLabel =
  (typeof BUSINESS_VERIFICATION_LABELS)[BusinessStatus];

export function businessVerificationLabel(status: BusinessStatus): MemberFacingVerificationLabel {
  return BUSINESS_VERIFICATION_LABELS[status];
}

export function businessVerificationIntent(status: BusinessStatus): StatusIntent {
  switch (status) {
    case "APPROVED":
      return "success";
    case "SUBMITTED":
    case "PENDING_REVIEW":
      return "info";
    case "NEEDS_CLARIFICATION":
      return "warning";
    case "REJECTED":
    case "SUSPENDED":
      return "danger";
    case "DRAFT":
    default:
      return "neutral";
  }
}

/** Member may submit/resubmit from these states only. */
export const MEMBER_SUBMIT_FROM: readonly BusinessStatus[] = [
  "DRAFT",
  "NEEDS_CLARIFICATION",
  "REJECTED",
] as const;

export type ExcoBusinessAction =
  | "start_review"
  | "request_clarification"
  | "approve"
  | "reject";

export function memberMaySubmit(status: BusinessStatus): boolean {
  return MEMBER_SUBMIT_FROM.includes(status);
}

export function allowedExcoTransitions(
  from: BusinessStatus,
  action: ExcoBusinessAction,
): BusinessStatus | null {
  switch (action) {
    case "start_review":
      if (from === "SUBMITTED" || from === "PENDING_REVIEW") return "PENDING_REVIEW";
      return null;
    case "request_clarification":
      if (from === "SUBMITTED" || from === "PENDING_REVIEW") return "NEEDS_CLARIFICATION";
      return null;
    case "approve":
      if (from === "SUBMITTED" || from === "PENDING_REVIEW") return "APPROVED";
      return null;
    case "reject":
      if (from === "SUBMITTED" || from === "PENDING_REVIEW") return "REJECTED";
      return null;
    default:
      return null;
  }
}
