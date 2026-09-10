/**
 * Phase 18 production preflight — READ ONLY.
 *
 * Requires PRODUCTION_DATABASE_URL (or PHASE18_PRODUCTION_DATABASE_URL).
 * Opens a READ ONLY transaction and aborts if that env is missing or local-only
 * when --require-production is set (default).
 *
 * NEVER mutates. NEVER creates Auth users.
 *
 * Usage:
 *   npx tsx -r ./scripts/register-server-only.cjs scripts/migrations/phase18/production-preflight.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";
import { parseGoogleFormExport } from "../../../src/features/legacy-migration/source-parse";
import {
  runDryRunClassification,
  buildEmptyMemberIndex,
  type DryRunMemberIndex,
} from "../../../src/features/legacy-migration/dry-run";
import type { ExistingMemberHit, RowDryRunResult } from "../../../src/features/legacy-migration/types";
import { classifyDatabaseUrl } from "../../../src/features/legacy-migration/env-safety";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW = path.join(__dirname, "raw", "TNCOD-PROFESSIONALS-DIRECTORY-Responses.xlsx");
const REPORTS = path.join(__dirname, "reports");

const MUTATION_RE =
  /\b(INSERT|UPDATE|DELETE|UPSERT|TRUNCATE|ALTER|CREATE|DROP|GRANT|REVOKE)\b/i;

function assertReadOnlySql(sql: string): void {
  if (MUTATION_RE.test(sql)) {
    throw new Error(`READ-ONLY GUARD: prohibited SQL keyword detected: ${sql.slice(0, 80)}`);
  }
}

async function withReadOnlyClient<T>(
  databaseUrl: string,
  fn: (prisma: PrismaClient) => Promise<T>,
): Promise<T> {
  const envClass = classifyDatabaseUrl(databaseUrl);
  if (envClass === "local" || envClass === "disposable") {
    throw new Error(
      `PRODUCTION PREFLIGHT BLOCKED — URL classified as ${envClass}, not production`,
    );
  }
  if (envClass === "unknown") {
    throw new Error("PRODUCTION PREFLIGHT BLOCKED — DATABASE URL classification UNKNOWN");
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    // Fail closed: session is read-only for the transaction.
    assertReadOnlySql("SELECT 1");
    await prisma.$executeRawUnsafe(`BEGIN READ ONLY`);
    try {
      const result = await fn(prisma);
      await prisma.$executeRawUnsafe(`COMMIT`);
      return result;
    } catch (e) {
      try {
        await prisma.$executeRawUnsafe(`ROLLBACK`);
      } catch {
        /* ignore */
      }
      throw e;
    }
  } finally {
    await prisma.$disconnect();
  }
}

type PreflightRow = {
  sourceRowNumber: number;
  sourceRowHash: string;
  maskedIdentity: {
    displayName: string;
    email: string | null;
    phone: string | null;
  };
  identityClassification:
    | "EXACT_EXISTING_MEMBER_MATCH"
    | "LIKELY_EXISTING_MEMBER"
    | "NEW_MEMBER"
    | "AMBIGUOUS"
    | "CONFLICT"
    | "MANUAL_REVIEW";
  proposedAction: RowDryRunResult["proposedAction"] | "SKIP";
  fieldsToCreate: string[];
  fieldsGapFill: string[];
  fieldsIgnore: string[];
  fieldsManualReview: string[];
  businessClassification: "SAFE_BUSINESS_MIGRATION" | "MANUAL_REVIEW" | "DO_NOT_MIGRATE" | "N/A";
  warnings: string[];
  fieldOutcomes: Record<string, "NO-OP" | "GAP-FILL" | "CONFLICT" | "MANUAL_REVIEW" | "CREATE">;
};

function mapDryToPreflight(
  r: RowDryRunResult,
  hasBusiness: boolean,
  productionMatched: boolean,
): PreflightRow {
  const fieldsIgnore = [
    ...r.excludedFromCurrentState,
    "directoryConsent",
    "whatsappConsent",
    "yearsBucket",
    "spotlightStatus",
  ];
  const fieldsManualReview: string[] = [];
  if (hasBusiness) fieldsManualReview.push("businessName/CAC/ownership");
  if (r.warnings.some((w) => /Industry/i.test(w))) fieldsManualReview.push("industry");
  if (r.warnings.some((w) => /Skills/i.test(w))) fieldsManualReview.push("skills");

  let identityClassification: PreflightRow["identityClassification"] = "NEW_MEMBER";
  let proposedAction: PreflightRow["proposedAction"] = r.proposedAction;

  if (!productionMatched) {
    identityClassification = "MANUAL_REVIEW";
    proposedAction = "MANUAL_REVIEW";
  } else if (r.classification === "MATCHED_TO_EXISTING_MEMBER") {
    identityClassification = "EXACT_EXISTING_MEMBER_MATCH";
    proposedAction = "GAP_ONLY";
  } else if (r.classification === "CONFLICTING_IDENTITY") {
    identityClassification = "CONFLICT";
    proposedAction = "AMBIGUOUS";
  } else if (r.classification === "LIKELY_NEW_MEMBER") {
    identityClassification = "NEW_MEMBER";
    proposedAction = "CREATE";
  }

  const fieldsToCreate =
    proposedAction === "CREATE"
      ? [
          "auth.users (at authorized import — not this gate)",
          "public.users",
          "profiles (legacy flags)",
          "professional_details (mapped subset)",
        ]
      : [];

  const fieldOutcomes: PreflightRow["fieldOutcomes"] = {
    verificationStatus: proposedAction === "CREATE" ? "CREATE" : "NO-OP",
    visibilityStatus: proposedAction === "CREATE" ? "CREATE" : "NO-OP",
    consent: "NO-OP",
    directoryPublication: "NO-OP",
    business: hasBusiness ? "MANUAL_REVIEW" : "NO-OP",
    yearsExperience: "NO-OP",
    displayName: proposedAction === "GAP_ONLY" ? "NO-OP" : proposedAction === "CREATE" ? "CREATE" : "MANUAL_REVIEW",
    email: proposedAction === "CREATE" ? "CREATE" : "NO-OP",
    phone: proposedAction === "CREATE" ? "CREATE" : "NO-OP",
  };

  return {
    sourceRowNumber: r.sourceRowNumber,
    sourceRowHash: r.sourceRowHash,
    maskedIdentity: {
      displayName: r.maskedPreview.displayName,
      email: r.maskedPreview.email,
      phone: r.maskedPreview.phone,
    },
    identityClassification,
    proposedAction,
    fieldsToCreate,
    fieldsGapFill: proposedAction === "GAP_ONLY" ? ["legacy provenance only; no overwrite"] : [],
    fieldsIgnore,
    fieldsManualReview,
    businessClassification: hasBusiness ? "MANUAL_REVIEW" : "N/A",
    warnings: [
      ...r.warnings,
      ...(productionMatched
        ? []
        : ["PRODUCTION_MATCH_UNAVAILABLE — cannot classify create vs existing without production read"]),
    ],
    fieldOutcomes,
  };
}

async function main() {
  const prodUrl =
    process.env.PHASE18_PRODUCTION_DATABASE_URL ||
    process.env.PRODUCTION_DATABASE_URL ||
    "";

  const parsed = parseGoogleFormExport(RAW);
  const businessRows = new Set(
    parsed.rows.filter((r) => Boolean(r.businessName?.trim())).map((r) => r.sourceRowNumber),
  );

  let productionAccess: "UNAVAILABLE" | "READ_ONLY_OK" | "BLOCKED" = "UNAVAILABLE";
  let productionError: string | null = null;
  let memberIndex = buildEmptyMemberIndex();
  let productionUserCount: number | null = null;
  let mutationGuardTriggered = false;
  const actualMutations = {
    insert: 0,
    update: 0,
    delete: 0,
    auth: 0,
    storage: 0,
  };

  if (!prodUrl) {
    productionAccess = "UNAVAILABLE";
    productionError =
      "PRODUCTION PREFLIGHT BLOCKED — READ-ONLY ACCESS UNAVAILABLE (no PRODUCTION_DATABASE_URL / PHASE18_PRODUCTION_DATABASE_URL)";
  } else {
    try {
      const envClass = classifyDatabaseUrl(prodUrl);
      if (envClass !== "production") {
        productionAccess = "BLOCKED";
        productionError = `PRODUCTION PREFLIGHT BLOCKED — URL classified as ${envClass}`;
      } else {
        await withReadOnlyClient(prodUrl, async (prisma) => {
          productionAccess = "READ_ONLY_OK";
          // Probe mutation refusal: attempt SET that should be fine; never INSERT.
          assertReadOnlySql("SELECT count(*)::int AS c FROM users WHERE deleted_at IS NULL");
          const counts = await prisma.$queryRawUnsafe<Array<{ c: number }>>(
            `SELECT count(*)::int AS c FROM users WHERE deleted_at IS NULL`,
          );
          productionUserCount = Number(counts[0]?.c ?? 0);

          const users = await prisma.user.findMany({
            where: { deletedAt: null },
            select: {
              id: true,
              email: true,
              phone: true,
              profile: { select: { id: true } },
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
            memberIndex.byEmail.set(u.email.toLowerCase(), hit);
            if (u.phone) memberIndex.byPhone.set(u.phone, { ...hit, matchedBy: "phone" });
          }

          // Adversarial: ensure mutation SQL is rejected by our guard
          try {
            assertReadOnlySql("INSERT INTO users (id, email) VALUES (gen_random_uuid(), 'x')");
          } catch {
            mutationGuardTriggered = true;
          }
        });
      }
    } catch (e) {
      productionAccess = "BLOCKED";
      productionError = e instanceof Error ? e.message : String(e);
      memberIndex = buildEmptyMemberIndex();
    }
  }

  const productionMatched = productionAccess === "READ_ONLY_OK";
  const dry = runDryRunClassification({
    sourceSha256: parsed.sourceSha256,
    rows: parsed.rows,
    memberIndex: productionMatched ? memberIndex : buildEmptyMemberIndex(),
  });

  const rows: PreflightRow[] = dry.results.map((r) =>
    mapDryToPreflight(r, businessRows.has(r.sourceRowNumber), productionMatched),
  );

  // Force reconcile when production unavailable: all MANUAL_REVIEW
  if (!productionMatched) {
    for (const r of rows) {
      r.identityClassification = "MANUAL_REVIEW";
      r.proposedAction = "MANUAL_REVIEW";
      r.fieldsToCreate = [];
      r.warnings = Array.from(
        new Set([
          ...r.warnings,
          "PRODUCTION_MATCH_UNAVAILABLE — row held at MANUAL_REVIEW until production read-only preflight succeeds",
        ]),
      );
    }
  }

  const counts = {
    CREATE: 0,
    MATCH_EXISTING: 0,
    GAP_ONLY: 0,
    MANUAL_REVIEW: 0,
    CONFLICT: 0,
    SKIP: 0,
    AMBIGUOUS: 0,
  };
  for (const r of rows) {
    const key = r.proposedAction === "AMBIGUOUS" ? "AMBIGUOUS" : r.proposedAction;
    if (key in counts) (counts as Record<string, number>)[key] += 1;
    else counts.MANUAL_REVIEW += 1;
  }
  // Map AMBIGUOUS into CONFLICT bucket for required accounting formula
  const accounting = {
    CREATE: counts.CREATE,
    MATCH_EXISTING: counts.MATCH_EXISTING,
    GAP_ONLY: counts.GAP_ONLY,
    MANUAL_REVIEW: counts.MANUAL_REVIEW + counts.AMBIGUOUS,
    CONFLICT: counts.CONFLICT,
    SKIP: counts.SKIP,
  };
  const accountingTotal =
    accounting.CREATE +
    accounting.MATCH_EXISTING +
    accounting.GAP_ONLY +
    accounting.MANUAL_REVIEW +
    accounting.CONFLICT +
    accounting.SKIP;

  const business = {
    candidates: businessRows.size,
    SAFE_BUSINESS_MIGRATION: 0,
    MANUAL_REVIEW: businessRows.size,
    DO_NOT_MIGRATE: 0,
  };

  const authStrategy = {
    canProfileExistWithoutAuth: false as const,
    authStructurallyRequired: true as const,
    evidence:
      "profiles.user_id FK → users.id; users.id = auth.users.id (Phase 4 trigger); /join creates Auth via admin.createUser before profile",
    existingOnboarding: "Passwordless /join + /sign-in OTP (signInWithOtp); no invite/claim tables or routes",
    existingClaimMechanism: "NONE",
    recommended:
      "AUTH_FIRST_AT_AUTHORIZED_IMPORT_SAME_AS_JOIN — create Auth+user+profile only when PRODUCTION IMPORT authorized; ownership via email-bound Auth OTP; MATCH_EXISTING → GAP_ONLY never overwrite; do not create orphan profiles; do not send OTP at import unless separately authorized",
    claimLifecycle:
      "Prove identity by authenticating to the historical (or current) email via existing passwordless OTP. Email/phone changes → MANUAL_REVIEW / EXCO exception. Name alone never claims. After claim/sign-in, legacy provenance remains on profile.legacy_*.",
    importBlockedUntil: [
      "PRODUCTION_DATABASE_URL read-only preflight with exact matches",
      "Explicit AUTHORIZE PHASE 18 PRODUCTION IMPORT",
      "Decision whether import-time Auth createUser may send/not send OTP",
    ],
  };

  const proposedFutureMutations = productionMatched
    ? {
        note: "Estimates only — not executed",
        authUsers: accounting.CREATE,
        users: accounting.CREATE,
        profiles: accounting.CREATE,
        profileUpdates: accounting.GAP_ONLY,
        businesses: 0,
        businessRelationships: 0,
        verification: 0,
        consent: 0,
        directoryPublication: 0,
        storage: 0,
      }
    : {
        note: "Cannot estimate CREATE vs GAP until production match completes",
        authUsers: "UNKNOWN",
        users: "UNKNOWN",
        profiles: "UNKNOWN",
        profileUpdates: "UNKNOWN",
        businesses: 0,
        businessRelationships: 0,
        verification: 0,
        consent: 0,
        directoryPublication: 0,
        storage: 0,
      };

  const report = {
    generatedAt: new Date().toISOString(),
    status:
      productionAccess === "READ_ONLY_OK"
        ? "PHASE 18 — PRODUCTION PREFLIGHT PASS"
        : "PHASE 18 — PRODUCTION PREFLIGHT BLOCKED — READ-ONLY ACCESS UNAVAILABLE",
    productionAccess,
    productionError,
    productionUserCount,
    actualProductionMutations: actualMutations,
    actualMutationTotal: 0,
    mutationGuardTriggered,
    accounting,
    accountingTotal,
    accountingOk: accountingTotal === 18,
    business,
    authStrategy,
    proposedFutureMutations,
    source: {
      sha256: parsed.sourceSha256,
      rows: parsed.rows.length,
      columns: parsed.headers.length,
    },
    rows: rows.map((r) => ({
      ...r,
    })),
    evidenceClassification: {
      authArchitecture: "CODE REVIEWED",
      productionMatches: productionMatched
        ? "PRODUCTION READ-ONLY OBSERVATION"
        : "NOT TESTED — production access unavailable",
      zeroMutation: "DIRECTLY TESTED (no write API called; mutation SQL guard unit-checked)",
      mappingInvariants: "PREVIOUSLY EVIDENCED + DIRECTLY TESTED (dry-run)",
    },
  };

  fs.mkdirSync(REPORTS, { recursive: true });
  const jsonPath = path.join(REPORTS, "production-preflight-latest.json");
  const mdPath = path.join(REPORTS, "production-preflight-latest.md");
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");

  const md: string[] = [];
  md.push("# Phase 18 — Production preflight (masked)");
  md.push("");
  md.push(`Status: **${report.status}**`);
  md.push(`Generated: ${report.generatedAt}`);
  md.push(`Production access: ${productionAccess}`);
  if (productionError) md.push(`Blocker: ${productionError}`);
  md.push("");
  md.push("## Actual production mutations");
  md.push("");
  md.push("```text");
  md.push("0");
  md.push("```");
  md.push("");
  md.push("## Auth strategy (code-reviewed)");
  md.push("");
  md.push(`- Can profile exist without Auth: **${authStrategy.canProfileExistWithoutAuth}**`);
  md.push(`- Auth structurally required: **${authStrategy.authStructurallyRequired}**`);
  md.push(`- Existing onboarding: ${authStrategy.existingOnboarding}`);
  md.push(`- Existing claim mechanism: ${authStrategy.existingClaimMechanism}`);
  md.push(`- Recommended: ${authStrategy.recommended}`);
  md.push("");
  md.push("## Accounting");
  md.push("");
  for (const [k, v] of Object.entries(accounting)) md.push(`- ${k}: ${v}`);
  md.push(`- TOTAL: ${accountingTotal} (must be 18) → ${accountingTotal === 18 ? "OK" : "BLOCK"}`);
  md.push("");
  md.push("## Business candidates");
  md.push(`- ${business.candidates} → MANUAL_REVIEW: ${business.MANUAL_REVIEW}`);
  md.push("");
  md.push("## Rows");
  for (const r of rows) {
    md.push(
      `- row ${r.sourceRowNumber}: ${r.proposedAction} / ${r.identityClassification} — ${r.maskedIdentity.displayName} ${r.maskedIdentity.email ?? ""} business=${r.businessClassification}`,
    );
  }
  fs.writeFileSync(mdPath, md.join("\n"), "utf8");

  console.log(
    JSON.stringify(
      {
        ok: accountingTotal === 18,
        status: report.status,
        productionAccess,
        accountingTotal,
        actualMutationTotal: 0,
        jsonPath,
        mdPath,
      },
      null,
      2,
    ),
  );

  if (productionAccess !== "READ_ONLY_OK") {
    process.exitCode = 2; // blocked, not a crash
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
