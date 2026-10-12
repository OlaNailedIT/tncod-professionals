/**
 * Phase 18A — Auth-first historical import CLI.
 *
 * Modes:
 *   (default)           — plan-only (no DB mutation)
 *   --plan-only         — same
 *   --execute-local     — mutate local/disposable only (requires --i-understand-this-mutates-local-db)
 *   --execute-production — requires full Production gate (credentials + exact auth phrase + project ref)
 *
 * Never expose as HTTP/API. Never log secrets.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { parseGoogleFormExport } from "../../../src/features/legacy-migration/source-parse";
import { AUTHORITATIVE_SHEET } from "../../../src/features/legacy-migration/types";
import { buildMigrationExecutionPlan } from "../../../src/features/legacy-migration/plan";
import { loadMemberIndexFromPrisma } from "../../../src/features/legacy-migration/member-index";
import { executeMigrationPlan } from "../../../src/features/legacy-migration/execute";
import { createMigrationAuthAdmin } from "../../../src/features/legacy-migration/auth-admin";
import {
  assertLocalMutationAllowed,
  assertProductionMutationAllowed,
  classifyDatabaseUrl,
  isProductionImportAuthorized,
  reportMigrationCredentialPresence,
} from "../../../src/features/legacy-migration/env-safety";
import { assertProductionTargetIdentity } from "../../../src/features/legacy-migration/target-safety";
import {
  EXPECTED_PRODUCTION_PROJECT_REF,
  EXPECTED_SOURCE_SHA256,
} from "../../../src/features/legacy-migration/constants";
import { assertSourceIntegrity } from "../../../src/features/legacy-migration/source-guard";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(__dirname, "raw", "TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx");
const REPORTS = path.join(__dirname, "reports");

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function main() {
  const executeLocal = hasFlag("--execute-local");
  const executeProduction = hasFlag("--execute-production");
  const planOnly = !executeLocal && !executeProduction;

  if (executeLocal && executeProduction) {
    throw new Error("Choose only one of --execute-local or --execute-production");
  }

  const parsed = parseGoogleFormExport(RAW);
  const integrity = assertSourceIntegrity({
    sha256: parsed.sourceSha256,
    authoritativeSheet: parsed.authoritativeSheet,
    rowCount: parsed.rows.length,
  });
  if (!integrity.ok) {
    throw new Error(`${integrity.code}: ${integrity.message}`);
  }

  const credentialPresence = reportMigrationCredentialPresence();
  const authEnabled = isProductionImportAuthorized();

  let memberIndex = undefined as Awaited<ReturnType<typeof loadMemberIndexFromPrisma>> | undefined;
  let prisma: PrismaClient | undefined;

  const needsDb = executeLocal || executeProduction || hasFlag("--with-db");
  if (needsDb) {
    if (executeProduction) {
      assertProductionMutationAllowed({
        importDatabaseUrl: process.env.PHASE18_IMPORT_DATABASE_URL,
        importServiceRoleKey: process.env.PHASE18_IMPORT_SERVICE_ROLE_KEY,
        importSupabaseUrl: process.env.PHASE18_IMPORT_SUPABASE_URL,
      });
      const target = assertProductionTargetIdentity({
        importDatabaseUrl: process.env.PHASE18_IMPORT_DATABASE_URL,
        importSupabaseUrl: process.env.PHASE18_IMPORT_SUPABASE_URL,
      });
      if (!target.ok) throw new Error(`${target.code}: ${target.message}`);

      prisma = new PrismaClient({
        datasources: { db: { url: process.env.PHASE18_IMPORT_DATABASE_URL } },
      });
      memberIndex = await loadMemberIndexFromPrisma(prisma);
    }

    if (executeLocal) {
      assertLocalMutationAllowed({
        databaseUrl: process.env.DATABASE_URL,
        explicitMutateFlag: hasFlag("--i-understand-this-mutates-local-db"),
      });
      const cls = classifyDatabaseUrl(process.env.DATABASE_URL);
      if (cls !== "local") {
        throw new Error(`--execute-local requires local DATABASE_URL (got ${cls})`);
      }
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
        throw new Error(
          "Local execute requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (local disposable Auth)",
        );
      }
      prisma = new PrismaClient();
      memberIndex = await loadMemberIndexFromPrisma(prisma);
    } else if (hasFlag("--with-db")) {
      const cls = classifyDatabaseUrl(process.env.DATABASE_URL);
      if (cls === "production") {
        throw new Error("Refusing --with-db against production DATABASE_URL");
      }
      prisma = new PrismaClient();
      memberIndex = await loadMemberIndexFromPrisma(prisma);
    }
  }

  const plan = buildMigrationExecutionPlan({
    sourceSha256: parsed.sourceSha256,
    authoritativeSheet: parsed.authoritativeSheet || AUTHORITATIVE_SHEET,
    rows: parsed.rows,
    memberIndex,
    enforceSourceIntegrity: true,
  });

  const planReport = {
    mode: planOnly ? "PLAN_ONLY" : executeLocal ? "EXECUTE_LOCAL" : "EXECUTE_PRODUCTION_BLOCKED",
    generatedAt: new Date().toISOString(),
    phase: "18A",
    productionImportAuthorizedEnv: authEnabled,
    productionMutationExecuted: false,
    expectedSourceSha256: EXPECTED_SOURCE_SHA256,
    expectedProductionProjectRef: EXPECTED_PRODUCTION_PROJECT_REF,
    credentialPresence,
    source: {
      sha256: parsed.sourceSha256,
      authoritativeSheet: parsed.authoritativeSheet,
      rowCount: parsed.rows.length,
    },
    planSummary: plan.summary,
    rows: plan.rows.map((r) => ({
      sourceRowNumber: r.sourceRowNumber,
      sourceRowHash: r.sourceRowHash,
      proposedAction: r.proposedAction,
      classification: r.classification,
      authAction: r.authAction,
      memberAction: r.memberAction,
      profileAction: r.profileAction,
      provenanceAction: r.provenanceAction,
      businessCandidate: r.businessCandidate,
      expectedVerificationStatus: r.expectedVerificationStatus,
      expectedVisibilityStatus: r.expectedVisibilityStatus,
      createBusiness: r.createBusiness,
      createConsent: r.createConsent,
      createSpotlightRecord: r.createSpotlightRecord,
      maskedPreview: r.maskedPreview,
      validationErrors: r.validationErrors,
    })),
  };

  fs.mkdirSync(REPORTS, { recursive: true });
  fs.writeFileSync(
    path.join(REPORTS, "phase18a-plan-latest.json"),
    JSON.stringify(planReport, null, 2),
    "utf8",
  );

  const md = [
    "# Phase 18A — Migration plan",
    "",
    `Generated: ${planReport.generatedAt}`,
    `Mode: ${planReport.mode}`,
    `Production authorization env: ${authEnabled ? "ENABLED (phrase present)" : "DISABLED"}`,
    `Production mutation executed: false`,
    "",
    `Source SHA256: \`${parsed.sourceSha256}\``,
    `Sheet: ${parsed.authoritativeSheet} | Rows: ${parsed.rows.length}`,
    "",
    "## Summary",
    ...Object.entries(plan.summary).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "## Credential presence (no values)",
    ...Object.entries(credentialPresence).map(([k, v]) => `- ${k}: ${v}`),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(REPORTS, "phase18a-plan-latest.md"), md, "utf8");

  if (planOnly) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "PLAN_ONLY",
          summary: plan.summary,
          productionMutationExecuted: false,
          report: "scripts/migrations/phase18/reports/phase18a-plan-latest.md",
        },
        null,
        2,
      ),
    );
    await prisma?.$disconnect();
    return;
  }

  if (executeLocal && prisma) {
    const auth = createMigrationAuthAdmin({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    });
    const batchKey = `phase18a-local-${parsed.sourceSha256.slice(0, 12)}-${Date.now()}`;
    const result = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey,
      environment: "local",
      sourceFilename: path.basename(RAW),
    });
    fs.writeFileSync(
      path.join(REPORTS, "phase18a-local-execute-latest.json"),
      JSON.stringify(
        {
          ...result,
          rows: result.rows.map((r) => ({
            ...r,
          })),
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "EXECUTE_LOCAL",
          summary: result.summary,
          productionMutationExecuted: false,
        },
        null,
        2,
      ),
    );
    await prisma.$disconnect();
    return;
  }

  if (executeProduction && prisma) {
    const auth = createMigrationAuthAdmin({
      supabaseUrl: process.env.PHASE18_IMPORT_SUPABASE_URL!,
      serviceRoleKey: process.env.PHASE18_IMPORT_SERVICE_ROLE_KEY!,
    });
    const batchKey = `phase18-prod-${parsed.sourceSha256.slice(0, 12)}-${Date.now()}`;
    const result = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey,
      environment: "production",
      sourceFilename: path.basename(RAW),
    });

    const safeReport = {
      mode: "EXECUTE_PRODUCTION",
      generatedAt: new Date().toISOString(),
      batchKey: result.batchKey,
      environment: result.environment,
      stageOrderInvariant: result.stageOrderInvariant,
      summary: result.summary,
      productionMutationExecuted: true,
      rows: result.rows.map((r) => ({
        sourceRowNumber: r.sourceRowNumber,
        sourceRowHash: r.sourceRowHash,
        proposedAction: r.proposedAction,
        outcome: r.outcome,
        stagesCompleted: r.stagesCompleted,
        error: r.error,
        businessCandidate: r.businessCandidate,
        // Omit raw userId/profileId from default console; keep hashed provenance only
        hasUserId: Boolean(r.userId),
        hasProfileId: Boolean(r.profileId),
      })),
    };
    fs.writeFileSync(
      path.join(REPORTS, "production-execute-latest.json"),
      JSON.stringify(safeReport, null, 2),
      "utf8",
    );
    const mdLines = [
      "# Phase 18 — Production execution report",
      "",
      `Generated: ${safeReport.generatedAt}`,
      `Batch: \`${result.batchKey}\``,
      `Environment: ${result.environment}`,
      "",
      "## Summary",
      ...Object.entries(result.summary).map(([k, v]) => `- ${k}: ${v}`),
      "",
      "## Rows (masked)",
      ...result.rows.map(
        (r) =>
          `- row ${r.sourceRowNumber}: ${r.outcome} / ${r.proposedAction} hash=${r.sourceRowHash.slice(0, 12)}… err=${r.error ?? "none"}`,
      ),
      "",
    ];
    fs.writeFileSync(path.join(REPORTS, "production-execute-latest.md"), mdLines.join("\n"), "utf8");

    console.log(
      JSON.stringify(
        {
          ok: result.summary.FAILED === 0 && result.summary.REFUSED === 0,
          mode: "EXECUTE_PRODUCTION",
          summary: result.summary,
          productionMutationExecuted: true,
          report: "scripts/migrations/phase18/reports/production-execute-latest.md",
        },
        null,
        2,
      ),
    );
    await prisma.$disconnect();
    return;
  }

  throw new Error("Unreachable import mode");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
