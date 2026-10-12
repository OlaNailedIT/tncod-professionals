/**
 * Phase 18A — source integrity fail-closed guards.
 */
import {
  EXPECTED_AUTHORITATIVE_SHEET,
  EXPECTED_SOURCE_ROW_COUNT,
  EXPECTED_SOURCE_SHA256,
} from "@/features/legacy-migration/constants";
import { AUTHORITATIVE_SHEET } from "@/features/legacy-migration/types";

export type SourceIntegrityInput = {
  sha256: string;
  authoritativeSheet: string;
  rowCount: number;
};

export type SourceIntegrityResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function assertSourceIntegrity(input: SourceIntegrityInput): SourceIntegrityResult {
  const sha = input.sha256.trim().toUpperCase();
  const expected = EXPECTED_SOURCE_SHA256.toUpperCase();
  if (sha !== expected) {
    return {
      ok: false,
      code: "SOURCE_SHA_MISMATCH",
      message: `Source SHA256 mismatch (got ${sha.slice(0, 12)}… expected ${expected.slice(0, 12)}…)`,
    };
  }
  if (input.authoritativeSheet !== EXPECTED_AUTHORITATIVE_SHEET) {
    return {
      ok: false,
      code: "SOURCE_SHEET_MISMATCH",
      message: `Authoritative sheet must be "${EXPECTED_AUTHORITATIVE_SHEET}"`,
    };
  }
  if (input.authoritativeSheet !== AUTHORITATIVE_SHEET) {
    return {
      ok: false,
      code: "SOURCE_SHEET_CONTRACT",
      message: "Authoritative sheet constant drift",
    };
  }
  if (input.rowCount !== EXPECTED_SOURCE_ROW_COUNT) {
    return {
      ok: false,
      code: "SOURCE_ROW_COUNT",
      message: `Expected ${EXPECTED_SOURCE_ROW_COUNT} rows, got ${input.rowCount}`,
    };
  }
  return { ok: true };
}
