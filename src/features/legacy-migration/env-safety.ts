/**
 * Production safety brake for Phase 18 / 18A migration scripts.
 * Dry-run never mutates. Production mutation defaults to DENY.
 */

import {
  EXPECTED_PRODUCTION_PROJECT_REF,
  PRODUCTION_IMPORT_AUTH_ENV_KEY,
  PRODUCTION_IMPORT_AUTH_PHRASE,
  PRODUCTION_PROJECT_REF_ENV_KEY,
} from "@/features/legacy-migration/constants";

export type MigrationEnvironment = "local" | "disposable" | "staging" | "production" | "unknown";

export function classifyDatabaseUrl(databaseUrl: string | undefined): MigrationEnvironment {
  if (!databaseUrl) return "unknown";
  const u = databaseUrl.toLowerCase();
  if (
    u.includes("localhost") ||
    u.includes("127.0.0.1") ||
    u.includes("supabase_db") ||
    u.includes("@db:5432")
  ) {
    return "local";
  }
  if (u.includes("supabase.co") || u.includes("pooler.supabase.com") || u.includes("amazonaws.com")) {
    return "production";
  }
  return "unknown";
}

export function assertDryRunSafe(_databaseUrl?: string): void {
  // Dry-run is always allowed; it must not mutate regardless of URL.
}

/**
 * Explicit Production import authorization — fail closed.
 * Credentials alone are never sufficient. CLI flags alone are never sufficient.
 */
export function isProductionImportAuthorized(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const raw = env[PRODUCTION_IMPORT_AUTH_ENV_KEY];
  if (typeof raw !== "string") return false;
  // Exact match only — leading/trailing whitespace is malformed → DENY.
  return raw === PRODUCTION_IMPORT_AUTH_PHRASE;
}

/**
 * Hard abort for local/disposable mutating import.
 * Must never accept Production authorization phrase or Production URLs.
 */
export function assertLocalMutationAllowed(input: {
  databaseUrl: string | undefined;
  explicitMutateFlag: boolean;
  /** Production phrase must not be passed on local path — always aborts. */
  productionAuthPhrase?: string;
}): void {
  if (input.productionAuthPhrase === PRODUCTION_IMPORT_AUTH_PHRASE) {
    throw new Error(
      "PRODUCTION IMPORT GATE DETECTED — use assertProductionMutationAllowed for Production. Aborting local path.",
    );
  }
  if (!input.explicitMutateFlag) {
    throw new Error("Mutating migration requires an explicit local mutate acknowledgment flag.");
  }
  const envClass = classifyDatabaseUrl(input.databaseUrl);
  if (envClass === "production" || envClass === "unknown" || envClass === "staging") {
    throw new Error(
      `Refusing migration mutation against environment=${envClass}. Local/disposable only.`,
    );
  }
}

export type ProductionMutationGateInput = {
  env?: Record<string, string | undefined>;
  /** Must be PHASE18_IMPORT_DATABASE_URL — not app DATABASE_URL. */
  importDatabaseUrl: string | undefined;
  importServiceRoleKey: string | undefined;
  importSupabaseUrl: string | undefined;
  projectRef?: string | undefined;
};

/**
 * Production mutation gate — all of: explicit auth phrase, import credentials,
 * production-class DB URL, and matching hosted project ref.
 */
export function assertProductionMutationAllowed(input: ProductionMutationGateInput): void {
  const env = input.env ?? process.env;

  if (!isProductionImportAuthorized(env)) {
    throw new Error(
      `Production import denied: set ${PRODUCTION_IMPORT_AUTH_ENV_KEY} to the exact governance phrase (default DENY).`,
    );
  }

  if (!input.importDatabaseUrl?.trim()) {
    throw new Error("Production import denied: PHASE18_IMPORT_DATABASE_URL required.");
  }
  if (!input.importServiceRoleKey?.trim()) {
    throw new Error("Production import denied: PHASE18_IMPORT_SERVICE_ROLE_KEY required.");
  }
  if (!input.importSupabaseUrl?.trim()) {
    throw new Error("Production import denied: PHASE18_IMPORT_SUPABASE_URL required.");
  }

  const dbClass = classifyDatabaseUrl(input.importDatabaseUrl);
  if (dbClass !== "production") {
    throw new Error(
      `Production import denied: PHASE18_IMPORT_DATABASE_URL class=${dbClass} (expected production).`,
    );
  }

  const expectedRef = (
    input.projectRef?.trim() ||
    env[PRODUCTION_PROJECT_REF_ENV_KEY]?.trim() ||
    EXPECTED_PRODUCTION_PROJECT_REF
  ).toLowerCase();

  if (expectedRef !== EXPECTED_PRODUCTION_PROJECT_REF) {
    throw new Error(
      `Production import denied: project ref mismatch (configured ${expectedRef}, expected ${EXPECTED_PRODUCTION_PROJECT_REF}).`,
    );
  }

  const haystack = `${input.importDatabaseUrl}\n${input.importSupabaseUrl}`.toLowerCase();
  if (!haystack.includes(expectedRef)) {
    throw new Error(
      "Production import denied: import URLs do not contain the expected Supabase project ref.",
    );
  }
}

/** Presence-only credential report — never values. */
export function reportMigrationCredentialPresence(
  env: Record<string, string | undefined> = process.env,
): Record<string, "PRESENT" | "ABSENT"> {
  const keys = [
    "PHASE18_PRODUCTION_DATABASE_URL",
    "PRODUCTION_DATABASE_URL",
    "PHASE18_IMPORT_DATABASE_URL",
    "PHASE18_IMPORT_SERVICE_ROLE_KEY",
    "PHASE18_IMPORT_SUPABASE_URL",
    PRODUCTION_IMPORT_AUTH_ENV_KEY,
    PRODUCTION_PROJECT_REF_ENV_KEY,
    "DATABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ] as const;
  const out: Record<string, "PRESENT" | "ABSENT"> = {};
  for (const k of keys) {
    const v = env[k];
    out[k] = typeof v === "string" && v.trim().length > 0 ? "PRESENT" : "ABSENT";
  }
  return out;
}
