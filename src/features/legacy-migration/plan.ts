/**
 * Phase 18A — execution plan built from the same dry-run classification pipeline.
 * Planning never mutates.
 */
import type { CanonicalLegacyRow, MappedLegacyPayload, ProposedAction } from "@/features/legacy-migration/types";
import {
  buildEmptyMemberIndex,
  runDryRunClassification,
  type DryRunMemberIndex,
} from "@/features/legacy-migration/dry-run";
import { assertSourceIntegrity } from "@/features/legacy-migration/source-guard";

export type PlannedAuthAction = "CREATE_AUTH_USER" | "REUSE_EXISTING_AUTH" | "NONE";
export type PlannedMemberAction = "CREATE_USER_ROW" | "REUSE_EXISTING_USER" | "NONE";
export type PlannedProfileAction = "CREATE_PROFILE" | "REUSE_EXISTING_PROFILE" | "NONE";
export type PlannedProvenanceAction = "WRITE_ROW" | "SKIP";

export type RowExecutionPlan = {
  sourceRowNumber: number;
  sourceRowHash: string;
  emailFingerprint: string | null;
  phoneNormalized: string | null;
  proposedAction: ProposedAction;
  classification: string;
  authAction: PlannedAuthAction;
  memberAction: PlannedMemberAction;
  profileAction: PlannedProfileAction;
  provenanceAction: PlannedProvenanceAction;
  businessCandidate: boolean;
  expectedVerificationStatus: "NOT_REVIEWED";
  expectedVisibilityStatus: "PRIVATE";
  expectedProfileStatus: "INCOMPLETE" | null;
  createBusiness: false;
  createConsent: false;
  createSpotlightRecord: false;
  warnings: string[];
  manualReviewReason: string | null;
  mapped: MappedLegacyPayload | null;
  maskedPreview: {
    displayName: string;
    email: string | null;
    phone: string | null;
    situation: string | null;
    hasBusinessCandidate: boolean;
  };
  validationErrors: string[];
};

export type MigrationExecutionPlan = {
  sourceSha256: string;
  authoritativeSheet: string;
  rowCount: number;
  summary: Record<string, number>;
  rows: RowExecutionPlan[];
};

function deriveActions(proposed: ProposedAction): {
  authAction: PlannedAuthAction;
  memberAction: PlannedMemberAction;
  profileAction: PlannedProfileAction;
  provenanceAction: PlannedProvenanceAction;
  validationErrors: string[];
} {
  switch (proposed) {
    case "CREATE":
      return {
        authAction: "CREATE_AUTH_USER",
        memberAction: "CREATE_USER_ROW",
        profileAction: "CREATE_PROFILE",
        provenanceAction: "WRITE_ROW",
        validationErrors: [],
      };
    case "GAP_ONLY":
    case "MATCH_EXISTING":
      return {
        authAction: "REUSE_EXISTING_AUTH",
        memberAction: "REUSE_EXISTING_USER",
        profileAction: "REUSE_EXISTING_PROFILE",
        provenanceAction: "WRITE_ROW",
        validationErrors: [],
      };
    case "SKIP_ALREADY_IMPORTED":
      return {
        authAction: "NONE",
        memberAction: "NONE",
        profileAction: "NONE",
        provenanceAction: "SKIP",
        validationErrors: [],
      };
    case "AMBIGUOUS":
    case "INVALID":
    case "MANUAL_REVIEW":
      return {
        authAction: "NONE",
        memberAction: "NONE",
        profileAction: "NONE",
        provenanceAction: "SKIP",
        validationErrors: [`Refuse mutate for action=${proposed}`],
      };
    default:
      return {
        authAction: "NONE",
        memberAction: "NONE",
        profileAction: "NONE",
        provenanceAction: "SKIP",
        validationErrors: [`Unknown action=${proposed}`],
      };
  }
}

/**
 * Build the execution plan from the authoritative dry-run classifier.
 * Execution must consume this plan (same mapped payloads) — not remap differently.
 */
export function buildMigrationExecutionPlan(input: {
  sourceSha256: string;
  authoritativeSheet: string;
  rows: CanonicalLegacyRow[];
  memberIndex?: DryRunMemberIndex;
  enforceSourceIntegrity?: boolean;
}): MigrationExecutionPlan {
  if (input.enforceSourceIntegrity !== false) {
    const guard = assertSourceIntegrity({
      sha256: input.sourceSha256,
      authoritativeSheet: input.authoritativeSheet,
      rowCount: input.rows.length,
    });
    if (!guard.ok) {
      throw new Error(`${guard.code}: ${guard.message}`);
    }
  }

  const classified = runDryRunClassification({
    sourceSha256: input.sourceSha256,
    rows: input.rows,
    memberIndex: input.memberIndex ?? buildEmptyMemberIndex(),
  });

  const planRows: RowExecutionPlan[] = classified.results.map((r) => {
    const derived = deriveActions(r.proposedAction);
    return {
      sourceRowNumber: r.sourceRowNumber,
      sourceRowHash: r.sourceRowHash,
      emailFingerprint: r.emailFingerprint,
      phoneNormalized: r.phoneNormalized,
      proposedAction: r.proposedAction,
      classification: r.classification,
      ...derived,
      businessCandidate: r.maskedPreview.hasBusinessCandidate,
      expectedVerificationStatus: "NOT_REVIEWED",
      expectedVisibilityStatus: "PRIVATE",
      expectedProfileStatus: r.mapped?.profileStatus ?? null,
      createBusiness: false,
      createConsent: false,
      createSpotlightRecord: false,
      warnings: r.warnings,
      manualReviewReason: r.manualReviewReason,
      mapped: r.mapped,
      maskedPreview: r.maskedPreview,
    };
  });

  return {
    sourceSha256: input.sourceSha256,
    authoritativeSheet: input.authoritativeSheet,
    rowCount: planRows.length,
    summary: classified.summary,
    rows: planRows,
  };
}
