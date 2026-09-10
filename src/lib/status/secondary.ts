/**
 * Secondary domain presentations from the Phase 2 schema contract.
 * Included for completeness; not promoted as a collapsed “platform status”.
 */
import type { StatusPresentation } from "./intents";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";
export type BusinessStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";
export type OpportunityStatus = "DRAFT" | "ACTIVE" | "CLOSED" | "EXPIRED";
export type DocumentStatus = "UPLOADED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";

const ACCOUNT: Record<AccountStatus, StatusPresentation> = {
  ACTIVE: { intent: "success", label: "Active" },
  SUSPENDED: { intent: "warning", label: "Suspended" },
  DEACTIVATED: { intent: "neutral", label: "Deactivated" },
};

const BUSINESS: Record<BusinessStatus, StatusPresentation> = {
  DRAFT: { intent: "neutral", label: "Draft" },
  SUBMITTED: { intent: "info", label: "Submitted" },
  PENDING_REVIEW: { intent: "info", label: "Pending review" },
  APPROVED: { intent: "success", label: "Approved" },
  REJECTED: { intent: "danger", label: "Rejected" },
  SUSPENDED: { intent: "warning", label: "Suspended" },
};

const OPPORTUNITY: Record<OpportunityStatus, StatusPresentation> = {
  DRAFT: { intent: "neutral", label: "Draft" },
  ACTIVE: { intent: "success", label: "Active" },
  CLOSED: { intent: "neutral", label: "Closed" },
  EXPIRED: { intent: "warning", label: "Expired" },
};

const DOCUMENT: Record<DocumentStatus, StatusPresentation> = {
  UPLOADED: { intent: "info", label: "Uploaded" },
  UNDER_REVIEW: { intent: "info", label: "Under review" },
  APPROVED: { intent: "success", label: "Approved" },
  REJECTED: { intent: "danger", label: "Rejected" },
};

export function presentAccountStatus(status: AccountStatus): StatusPresentation {
  return ACCOUNT[status];
}

export function presentBusinessStatus(status: BusinessStatus): StatusPresentation {
  return BUSINESS[status];
}

export function presentOpportunityStatus(status: OpportunityStatus): StatusPresentation {
  return OPPORTUNITY[status];
}

export function presentDocumentStatus(status: DocumentStatus): StatusPresentation {
  return DOCUMENT[status];
}
