import type {
  CanonicalLegacyRow,
  ExistingMemberHit,
  RowDryRunResult,
} from "@/features/legacy-migration/types";
import { mapToPlatformPayload } from "@/features/legacy-migration/map";
import { classifyIdentity, nameOnlyMergeAllowed } from "@/features/legacy-migration/identity";
import {
  computeSourceRowHashFromCanonical,
  emailFingerprint,
} from "@/features/legacy-migration/row-hash";
import { maskEmail, maskName, maskPhone } from "@/features/legacy-migration/mask";

export type DryRunMemberIndex = {
  byEmail: Map<string, ExistingMemberHit>;
  byPhone: Map<string, ExistingMemberHit>;
  importedHashes: Set<string>;
};

export function buildEmptyMemberIndex(): DryRunMemberIndex {
  return {
    byEmail: new Map(),
    byPhone: new Map(),
    importedHashes: new Set(),
  };
}

function duplicateFlags(rows: CanonicalLegacyRow[]) {
  const emails = new Map<string, number>();
  const phones = new Map<string, number>();
  for (const r of rows) {
    if (r.emailNormalized) emails.set(r.emailNormalized, (emails.get(r.emailNormalized) ?? 0) + 1);
    if (r.phoneNormalized) phones.set(r.phoneNormalized, (phones.get(r.phoneNormalized) ?? 0) + 1);
  }
  return { emails, phones };
}

/**
 * Pure dry-run classification — no database writes.
 * nameOnlyMergeAllowed() is asserted false for adversarial coverage.
 */
export function runDryRunClassification(input: {
  sourceSha256: string;
  rows: CanonicalLegacyRow[];
  memberIndex?: DryRunMemberIndex;
}): {
  results: RowDryRunResult[];
  summary: Record<string, number>;
} {
  if (nameOnlyMergeAllowed() !== false) {
    throw new Error("Name-only merge must remain forbidden");
  }

  const index = input.memberIndex ?? buildEmptyMemberIndex();
  const dup = duplicateFlags(input.rows);
  const results: RowDryRunResult[] = [];

  for (const row of input.rows) {
    const sourceRowHash = computeSourceRowHashFromCanonical(input.sourceSha256, row);
    const mapping = mapToPlatformPayload(row);
    const identity = classifyIdentity({
      emailNormalized: row.emailNormalized,
      phoneNormalized: row.phoneNormalized,
      fullName: row.fullName,
      existingByEmail: row.emailNormalized ? index.byEmail.get(row.emailNormalized) ?? null : null,
      existingByPhone: row.phoneNormalized ? index.byPhone.get(row.phoneNormalized) ?? null : null,
      alreadyImportedHash: index.importedHashes.has(sourceRowHash),
      duplicateSourceEmails: Boolean(
        row.emailNormalized && (dup.emails.get(row.emailNormalized) ?? 0) > 1,
      ),
      duplicateSourcePhones: Boolean(
        row.phoneNormalized && (dup.phones.get(row.phoneNormalized) ?? 0) > 1,
      ),
    });

    let proposedAction = identity.proposedAction;
    let manualReviewReason = identity.reason;
    const warnings = [...mapping.warnings];

    if (mapping.mapped === null && proposedAction === "CREATE") {
      proposedAction = "INVALID";
      manualReviewReason = mapping.manualReviewReasons.join("; ") || "Mapping failed";
    } else if (mapping.manualReviewReasons.length > 0 && proposedAction === "CREATE") {
      // Still creatable for core profile, but flagged for review on taxonomy/business.
      warnings.push(...mapping.manualReviewReasons);
      // Keep CREATE for profile shell; business/taxonomy remain excluded in mapped payload.
    } else if (mapping.manualReviewReasons.length > 0 && proposedAction === "GAP_ONLY") {
      warnings.push(...mapping.manualReviewReasons);
    }

    if (proposedAction === "CREATE") {
      warnings.push(
        "AUTH_REQUIRED: actual import cannot create public.users without auth.users — Auth strategy still OPEN DECISION",
      );
    }

    // Force baseline privacy invariants on mapped payload
    if (mapping.mapped) {
      if (mapping.mapped.verificationStatus !== "NOT_REVIEWED") {
        throw new Error("Invariant broken: verification must be NOT_REVIEWED");
      }
      if (mapping.mapped.visibilityStatus !== "PRIVATE") {
        throw new Error("Invariant broken: visibility must be PRIVATE");
      }
      if (mapping.mapped.createConsent || mapping.mapped.createBusiness || mapping.mapped.createSpotlightRecord) {
        throw new Error("Invariant broken: consent/business/spotlight create must be false");
      }
    }

    results.push({
      sourceRowNumber: row.sourceRowNumber,
      sourceRowHash,
      emailFingerprint: emailFingerprint(row.emailNormalized),
      phoneNormalized: row.phoneNormalized,
      classification: identity.classification,
      proposedAction,
      warnings,
      manualReviewReason,
      maskedPreview: {
        displayName: maskName(mapping.mapped?.displayName ?? row.fullName),
        email: maskEmail(row.emailNormalized),
        phone: maskPhone(row.phoneNormalized),
        situation: mapping.mapped?.professionalSituation ?? null,
        hasBusinessCandidate: Boolean(row.businessName),
      },
      mapped: mapping.mapped,
      excludedFromCurrentState: mapping.excludedFromCurrentState,
    });
  }

  const summary: Record<string, number> = {};
  for (const r of results) {
    summary[r.proposedAction] = (summary[r.proposedAction] ?? 0) + 1;
    summary[`class:${r.classification}`] = (summary[`class:${r.classification}`] ?? 0) + 1;
  }
  summary.total = results.length;

  return { results, summary };
}

/** Simulate second pass idempotency: mark first-pass CREATE hashes as imported. */
export function indexAfterSimulatedImport(
  previous: DryRunMemberIndex,
  results: RowDryRunResult[],
): DryRunMemberIndex {
  const next: DryRunMemberIndex = {
    byEmail: new Map(previous.byEmail),
    byPhone: new Map(previous.byPhone),
    importedHashes: new Set(previous.importedHashes),
  };
  for (const r of results) {
    if (r.proposedAction === "CREATE" || r.proposedAction === "GAP_ONLY") {
      next.importedHashes.add(r.sourceRowHash);
    }
  }
  return next;
}
