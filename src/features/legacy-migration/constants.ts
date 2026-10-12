/**
 * Phase 18 / 18A — locked source and Production target constants.
 * Never put secrets here.
 */

/** Authoritative XLSX SHA-256 (64 hex). */
export const EXPECTED_SOURCE_SHA256 =
  "4EC0A1773D771F78488169B44DA7DCF424BD0354684A2D42F6C06264E12CE29C";

/**
 * Recovery twin (2026-09-10) — same 18 identities (email/phone/name fingerprints),
 * different OOXML packaging hash. Safe alternate when Excel cannot open the primary.
 */
export const RECOVERY_SOURCE_SHA256_BDD21A1C =
  "BDD21A1CFDA9989D71FCD5812F1E33C6B3AF5B6B745F2E32754C7B3A6FE54F8C";

export const EXPECTED_SOURCE_ROW_COUNT = 18;

export const EXPECTED_AUTHORITATIVE_SHEET = "Form responses 1" as const;

/** Hosted Supabase Production project ref (non-secret). */
export const EXPECTED_PRODUCTION_PROJECT_REF = "brpppukzqgpzxjelwwrj";

/** Exact governance phrase required for Production mutation (never default-true). */
export const PRODUCTION_IMPORT_AUTH_PHRASE = "AUTHORIZE PHASE 18 PRODUCTION IMPORT";

/** Env key that must equal PRODUCTION_IMPORT_AUTH_PHRASE to allow Production writes. */
export const PRODUCTION_IMPORT_AUTH_ENV_KEY = "PHASE18_PRODUCTION_IMPORT_AUTHORIZED";

export const PRODUCTION_PROJECT_REF_ENV_KEY = "PHASE18_PRODUCTION_PROJECT_REF";
