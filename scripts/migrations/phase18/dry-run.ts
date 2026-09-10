/**
 * Phase 18 dry-run — no DB mutation by default.
 *
 * Usage:
 *   npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/dry-run.ts
 *   npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/dry-run.ts --with-db
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseGoogleFormExport } from "../../../src/features/legacy-migration/source-parse";
import {
  buildEmptyMemberIndex,
  indexAfterSimulatedImport,
  runDryRunClassification,
  type DryRunMemberIndex,
} from "../../../src/features/legacy-migration/dry-run";
import {
  assertDryRunSafe,
  classifyDatabaseUrl,
  isProductionImportAuthorized,
} from "../../../src/features/legacy-migration/env-safety";
import type { ExistingMemberHit } from "../../../src/features/legacy-migration/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(__dirname, "raw", "TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx");
const REPORTS = path.join(__dirname, "reports");

async function loadMemberIndexFromDb(): Promise<DryRunMemberIndex> {
  assertDryRunSafe(process.env.DATABASE_URL);
  const env = classifyDatabaseUrl(process.env.DATABASE_URL);
  if (env === "production") {
    throw new Error("Refusing --with-db against production DATABASE_URL");
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  const index = buildEmptyMemberIndex();
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        phone: true,
        profile: { select: { id: true, legacyImport: true } },
      },
    });
    for (const u of users) {
      if (!u.profile) continue;
      const hit: ExistingMemberHit = {
        userId: u.id,
        profileId: u.profile.id,
        email: u.email.toLowerCase(),
        phone: u.phone,
        matchedBy: "email",
      };
      index.byEmail.set(u.email.toLowerCase(), { ...hit, matchedBy: "email" });
      if (u.phone) index.byPhone.set(u.phone, { ...hit, matchedBy: "phone" });
    }
    const imported = await prisma.legacyImportRow.findMany({
      where: { profileId: { not: null } },
      select: { sourceRowHash: true },
    });
    for (const row of imported) index.importedHashes.add(row.sourceRowHash);
  } catch (e) {
    // Schema may not be applied yet — continue with empty index for parse/classify.
    console.warn(
      "DB member index unavailable (migration metadata may be unapplied):",
      e instanceof Error ? e.message : e,
    );
  } finally {
    await prisma.$disconnect();
  }
  return index;
}

async function main() {
  if (isProductionImportAuthorized()) {
    throw new Error("Production import must remain unauthorized");
  }

  const withDb = process.argv.includes("--with-db");
  const parsed = parseGoogleFormExport(RAW);
  const memberIndex = withDb ? await loadMemberIndexFromDb() : buildEmptyMemberIndex();

  const pass1 = runDryRunClassification({
    sourceSha256: parsed.sourceSha256,
    rows: parsed.rows,
    memberIndex,
  });

  // Idempotency simulation (no DB write)
  const after = indexAfterSimulatedImport(memberIndex, pass1.results);
  const pass2 = runDryRunClassification({
    sourceSha256: parsed.sourceSha256,
    rows: parsed.rows,
    memberIndex: after,
  });

  const batchKey = `phase18-google-form-dryrun-${parsed.sourceSha256.slice(0, 12)}-${Date.now()}`;
  const report = {
    mode: "DRY_RUN",
    batchKey,
    generatedAt: new Date().toISOString(),
    productionImportAuthorized: false,
    source: {
      path: parsed.sourcePath,
      sha256: parsed.sourceSha256,
      authoritativeSheet: parsed.authoritativeSheet,
      sheetNames: parsed.sheetNames,
      rowCount: parsed.rows.length,
      columnCount: parsed.headers.length,
    },
    withDb,
    summary: pass1.summary,
    idempotencyPass2Summary: pass2.summary,
    rows: pass1.results.map((r) => ({
      sourceRowNumber: r.sourceRowNumber,
      sourceRowHash: r.sourceRowHash,
      emailFingerprint: r.emailFingerprint,
      classification: r.classification,
      proposedAction: r.proposedAction,
      warnings: r.warnings,
      manualReviewReason: r.manualReviewReason,
      maskedPreview: r.maskedPreview,
      platformBaseline: r.mapped
        ? {
            profileStatus: r.mapped.profileStatus,
            verificationStatus: r.mapped.verificationStatus,
            visibilityStatus: r.mapped.visibilityStatus,
            createConsent: r.mapped.createConsent,
            createBusiness: r.mapped.createBusiness,
            createSpotlightRecord: r.mapped.createSpotlightRecord,
            yearsExperience: r.mapped.yearsExperience,
          }
        : null,
      excludedFromCurrentState: r.excludedFromCurrentState,
    })),
  };

  fs.mkdirSync(REPORTS, { recursive: true });
  const jsonPath = path.join(REPORTS, "dry-run-latest.json");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const md: string[] = [];
  md.push("# Phase 18 dry-run report (masked)");
  md.push("");
  md.push(`Batch: \`${batchKey}\``);
  md.push(`Source SHA256: \`${parsed.sourceSha256}\``);
  md.push(`Rows: ${parsed.rows.length} | Columns: ${parsed.headers.length}`);
  md.push(`withDb: ${withDb}`);
  md.push("");
  md.push("## Summary (pass 1)");
  for (const [k, v] of Object.entries(pass1.summary)) md.push(`- ${k}: ${v}`);
  md.push("");
  md.push("## Idempotency (pass 2 after simulated import)");
  for (const [k, v] of Object.entries(pass2.summary)) md.push(`- ${k}: ${v}`);
  md.push("");
  md.push("## Rows");
  for (const r of report.rows) {
    md.push(
      `- row ${r.sourceRowNumber}: ${r.proposedAction} / ${r.classification} — ${r.maskedPreview.displayName} ${r.maskedPreview.email ?? ""}`,
    );
  }
  const mdPath = path.join(REPORTS, "dry-run-latest.md");
  fs.writeFileSync(mdPath, md.join("\n"), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        jsonPath,
        mdPath,
        summary: pass1.summary,
        idempotencySkipOnPass2: pass2.summary.SKIP_ALREADY_IMPORTED ?? 0,
        productionImportAuthorized: false,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
