import type { BusinessStatus, VerificationStatus } from "@prisma/client";
import { businessVerificationLabel } from "@/features/business/verification-status";
import { professionalVerificationLabel } from "@/features/professional/verification-status";
import { presentVerificationStatus } from "@/lib/status/presentations";

export type VerificationQueueTab =
  | "attention"
  | "pending"
  | "under_review"
  | "needs_clarification"
  | "verified"
  | "rejected";

export type VerificationQueueItem = {
  domain: "professional" | "business";
  id: string;
  title: string;
  subtitle: string | null;
  statusKey: string;
  statusLabel: string;
  href: string;
  updatedAt: string;
};

export const PROFESSIONAL_TAB: Record<
  Exclude<VerificationQueueTab, "attention">,
  VerificationStatus[]
> = {
  pending: ["PENDING"],
  under_review: ["UNDER_REVIEW"],
  needs_clarification: ["NEEDS_CLARIFICATION"],
  verified: ["VERIFIED"],
  rejected: ["REJECTED"],
};

export const BUSINESS_TAB: Record<Exclude<VerificationQueueTab, "attention">, BusinessStatus[]> = {
  pending: ["SUBMITTED"],
  under_review: ["PENDING_REVIEW"],
  needs_clarification: ["NEEDS_CLARIFICATION"],
  verified: ["APPROVED"],
  rejected: ["REJECTED"],
};

export function parseVerificationTab(
  raw: string | string[] | undefined,
): VerificationQueueTab {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (
    v === "pending" ||
    v === "under_review" ||
    v === "needs_clarification" ||
    v === "verified" ||
    v === "rejected" ||
    v === "attention"
  ) {
    return v;
  }
  return "attention";
}

export function queueStatusIntent(domain: "professional" | "business", statusKey: string) {
  if (domain === "professional") {
    return presentVerificationStatus(statusKey as VerificationStatus).intent;
  }
  switch (statusKey) {
    case "APPROVED":
      return "success" as const;
    case "NEEDS_CLARIFICATION":
      return "warning" as const;
    case "REJECTED":
    case "SUSPENDED":
      return "danger" as const;
    case "SUBMITTED":
    case "PENDING_REVIEW":
      return "info" as const;
    default:
      return "neutral" as const;
  }
}

export function toQueueItemProfessional(input: {
  id: string;
  displayName: string;
  profession: string | null;
  verificationStatus: VerificationStatus;
  updatedAt: Date;
  tab: VerificationQueueTab;
}): VerificationQueueItem {
  return {
    domain: "professional",
    id: input.id,
    title: input.displayName,
    subtitle: input.profession,
    statusKey: input.verificationStatus,
    statusLabel: professionalVerificationLabel(input.verificationStatus),
    href: `/exco/professionals/${input.id}?from=verification&tab=${input.tab}`,
    updatedAt: input.updatedAt.toISOString(),
  };
}

export function toQueueItemBusiness(input: {
  id: string;
  name: string;
  industryName: string | null;
  businessStatus: BusinessStatus;
  updatedAt: Date;
  tab: VerificationQueueTab;
}): VerificationQueueItem {
  return {
    domain: "business",
    id: input.id,
    title: input.name,
    subtitle: input.industryName,
    statusKey: input.businessStatus,
    statusLabel: businessVerificationLabel(input.businessStatus),
    href: `/exco/businesses/${input.id}?from=verification&tab=${input.tab}`,
    updatedAt: input.updatedAt.toISOString(),
  };
}
