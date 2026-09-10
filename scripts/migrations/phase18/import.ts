/**
 * Phase 18 mutating import — HARD ABORT in this gate.
 * Production import is NOT authorized.
 */
import {
  assertLocalMutationAllowed,
  isProductionImportAuthorized,
} from "../../../src/features/legacy-migration/env-safety";

function main() {
  if (isProductionImportAuthorized()) {
    throw new Error("Production import must remain unauthorized");
  }
  assertLocalMutationAllowed({
    databaseUrl: process.env.DATABASE_URL,
    explicitMutateFlag: process.argv.includes("--i-understand-this-mutates-local-db"),
    productionAuthPhrase: process.argv.includes("--production")
      ? "AUTHORIZE PHASE 18 PRODUCTION IMPORT"
      : undefined,
  });
  throw new Error(
    "Phase 18 IMPORT is intentionally unimplemented in this gate. Use dry-run.ts only. Production requires AUTHORIZE PHASE 18 PRODUCTION IMPORT.",
  );
}

main();
