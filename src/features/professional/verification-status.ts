import type { VerificationStatus } from "@prisma/client";
import type { StatusIntent } from "@/lib/status";

/** Member-facing professional verification labels (canonical enum unchanged). */
export const PROFESSIONAL_VERIFICATION_LABELS = {
  NOT_REVIEWED: "Not reviewed",
  PENDING: "Pending",
  UNDER_REVIEW: "Under review",
  VERIFIED: "Verified",
  NEEDS_CLARIFICATION: "Needs clarification",
  REJECTED: "Rejected",
} as const satisfies Record<VerificationStatus, string>;

export function professionalVerificationLabel(status: VerificationStatus): string {
  return PROFESSIONAL_VERIFICATION_LABELS[status];
}

export function professionalVerificationIntent(status: VerificationStatus): StatusIntent {
  switch (status) {
    case "VERIFIED":
      return "success";
    case "PENDING":
    case "UNDER_REVIEW":
      return "info";
    case "NEEDS_CLARIFICATION":
      return "warning";
    case "REJECTED":
      return "danger";
    case "NOT_REVIEWED":
    default:
      return "neutral";
  }
}

export const MEMBER_SUBMIT_FROM: readonly VerificationStatus[] = [
  "NOT_REVIEWED",
  "NEEDS_CLARIFICATION",
  "REJECTED",
] as const;

export type ExcoProfessionalAction =
  | "start_review"
  | "verify"
  | "request_clarification"
  | "reject";

export function memberMaySubmitVerification(status: VerificationStatus): boolean {
  return MEMBER_SUBMIT_FROM.includes(status);
}

/** EXCO terminal/review transitions — start_review required before verify/clarify/reject. */
export function allowedExcoProfessionalTransitions(
  from: VerificationStatus,
  action: ExcoProfessionalAction,
): VerificationStatus | null {
  switch (action) {
    case "start_review":
      if (from === "PENDING" || from === "UNDER_REVIEW") return "UNDER_REVIEW";
      return null;
    case "verify":
      if (from === "UNDER_REVIEW") return "VERIFIED";
      return null;
    case "request_clarification":
      if (from === "UNDER_REVIEW") return "NEEDS_CLARIFICATION";
      return null;
    case "reject":
      if (from === "UNDER_REVIEW") return "REJECTED";
      return null;
    default:
      return null;
  }
}
