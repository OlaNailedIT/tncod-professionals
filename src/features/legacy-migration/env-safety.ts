/**
 * Production safety brake for Phase 18 migration scripts.
 * Dry-run never mutates. Mutating paths must refuse production.
 */

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
 * Hard abort for any mutating import attempt against non-local environments.
 * Production import requires a separate governance phrase — not implemented here.
 */
export function assertLocalMutationAllowed(input: {
  databaseUrl: string | undefined;
  explicitMutateFlag: boolean;
  productionAuthPhrase?: string;
}): void {
  if (input.productionAuthPhrase === "AUTHORIZE PHASE 18 PRODUCTION IMPORT") {
    throw new Error(
      "PRODUCTION IMPORT GATE DETECTED — this task must not execute production import. Aborting.",
    );
  }
  if (!input.explicitMutateFlag) {
    throw new Error("Mutating migration requires an explicit local mutate acknowledgment flag.");
  }
  const env = classifyDatabaseUrl(input.databaseUrl);
  if (env === "production" || env === "unknown" || env === "staging") {
    throw new Error(
      `Refusing migration mutation against environment=${env}. Local/disposable only.`,
    );
  }
}

export function isProductionImportAuthorized(): false {
  return false;
}
