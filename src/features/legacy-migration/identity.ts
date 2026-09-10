import type {
  ExistingMemberHit,
  IdentityClassification,
  ProposedAction,
} from "@/features/legacy-migration/types";

/**
 * Name alone must never merge people.
 */
export function classifyIdentity(input: {
  emailNormalized: string | null;
  phoneNormalized: string | null;
  fullName: string;
  existingByEmail: ExistingMemberHit | null;
  existingByPhone: ExistingMemberHit | null;
  alreadyImportedHash: boolean;
  duplicateSourceEmails: boolean;
  duplicateSourcePhones: boolean;
}): { classification: IdentityClassification; proposedAction: ProposedAction; reason: string | null } {
  if (input.alreadyImportedHash) {
    return {
      classification: "ALREADY_IMPORTED",
      proposedAction: "SKIP_ALREADY_IMPORTED",
      reason: null,
    };
  }

  if (!input.emailNormalized && !input.phoneNormalized) {
    return {
      classification: "UNMATCHABLE",
      proposedAction: "INVALID",
      reason: "No usable email or phone",
    };
  }

  if (input.duplicateSourceEmails || input.duplicateSourcePhones) {
    return {
      classification: "DUPLICATE_WITHIN_LEGACY_SOURCE",
      proposedAction: "AMBIGUOUS",
      reason: "Duplicate email or phone within legacy source",
    };
  }

  const byEmail = input.existingByEmail;
  const byPhone = input.existingByPhone;

  if (byEmail && byPhone && byEmail.userId !== byPhone.userId) {
    return {
      classification: "CONFLICTING_IDENTITY",
      proposedAction: "AMBIGUOUS",
      reason: "Email and phone match different existing members",
    };
  }

  if (byEmail || byPhone) {
    return {
      classification: "MATCHED_TO_EXISTING_MEMBER",
      proposedAction: "GAP_ONLY",
      reason: null,
    };
  }

  if (!input.emailNormalized) {
    return {
      classification: "AMBIGUOUS_IDENTITY",
      proposedAction: "MANUAL_REVIEW",
      reason: "Phone-only identity without email — review before create",
    };
  }

  return {
    classification: "LIKELY_NEW_MEMBER",
    proposedAction: "CREATE",
    reason: null,
  };
}

/** Explicitly reject name-only matching. */
export function nameOnlyMergeAllowed(): false {
  return false;
}
