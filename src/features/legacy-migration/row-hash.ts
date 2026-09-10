import { createHash } from "node:crypto";
import type { CanonicalLegacyRow } from "@/features/legacy-migration/types";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex").toUpperCase();
}

export function emailFingerprint(normalizedEmail: string | null): string | null {
  if (!normalizedEmail) return null;
  return sha256Hex(`email:${normalizedEmail}`);
}

/**
 * Deterministic source-row identity.
 *
 * Includes:
 * - source file SHA-256 (ties row to exact export bytes)
 * - spreadsheet row number (stable within that export)
 * - normalized email + phone + trimmed full name (detect content drift)
 *
 * Does NOT use Timestamp alone (can change on re-export formatting).
 * If source bytes change → sourceSha256 changes → all hashes change (predictable).
 * If one person's email/phone/name changes in a new export → that row's hash changes
 * → treated as a different source identity (not silently merged with prior import).
 */
export function computeSourceRowHash(input: {
  sourceSha256: string;
  sourceRowNumber: number;
  emailNormalized: string | null;
  phoneNormalized: string | null;
  fullName: string;
}): string {
  const canonical = [
    input.sourceSha256.toUpperCase(),
    String(input.sourceRowNumber),
    input.emailNormalized ?? "",
    input.phoneNormalized ?? "",
    input.fullName.trim().replace(/\s+/g, " "),
  ].join("|");
  return sha256Hex(canonical);
}

export function computeSourceRowHashFromCanonical(
  sourceSha256: string,
  row: Pick<
    CanonicalLegacyRow,
    "sourceRowNumber" | "emailNormalized" | "phoneNormalized" | "fullName"
  >,
): string {
  return computeSourceRowHash({
    sourceSha256,
    sourceRowNumber: row.sourceRowNumber,
    emailNormalized: row.emailNormalized,
    phoneNormalized: row.phoneNormalized,
    fullName: row.fullName,
  });
}
