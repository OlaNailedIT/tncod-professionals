/**
 * Phase 18A — Auth-first historical import executor.
 * Consumes MigrationExecutionPlan (dry-run parity). No browser/API exposure.
 *
 * Ordering invariant: Auth → public.users → MEMBER role → profile → provenance.
 * Never profile-before-Auth. Never OTP by default. Never VERIFIED/DIRECTORY/consent/Spotlight/business.
 */
import type { PrismaClient } from "@prisma/client";
import { LEGACY_SOURCE } from "@/features/legacy-migration/types";
import type { MigrationExecutionPlan, RowExecutionPlan } from "@/features/legacy-migration/plan";

export type AuthCreateResult =
  | { ok: true; userId: string; created: boolean }
  | { ok: false; duplicate: boolean; message: string };

export type MigrationAuthAdmin = {
  createUserWithoutPassword: (email: string) => Promise<AuthCreateResult>;
};

export type StageName = "auth" | "user" | "role" | "profile" | "provenance";

export type RowExecutionResult = {
  sourceRowNumber: number;
  sourceRowHash: string;
  proposedAction: string;
  outcome:
    | "CREATED"
    | "SKIP_ALREADY_IMPORTED"
    | "GAP_ONLY_PROVENANCE"
    | "REFUSED"
    | "FAILED";
  userId: string | null;
  profileId: string | null;
  stagesCompleted: StageName[];
  error: string | null;
  businessCandidate: boolean;
};

export type BatchExecutionResult = {
  batchKey: string;
  environment: "local" | "disposable" | "staging" | "production";
  mode: "IMPORT";
  summary: Record<string, number>;
  rows: RowExecutionResult[];
  stageOrderInvariant: "AUTH_FIRST";
};

export type ExecuteMigrationInput = {
  prisma: PrismaClient;
  auth: MigrationAuthAdmin;
  plan: MigrationExecutionPlan;
  batchKey: string;
  environment: "local" | "disposable" | "staging" | "production";
  sourceFilename: string;
  /** Instrumentation hook — stages must appear in Auth-first order. */
  onStage?: (stage: StageName, row: RowExecutionPlan) => void;
};

function emptySummary(): Record<string, number> {
  return {
    CREATED: 0,
    SKIP_ALREADY_IMPORTED: 0,
    GAP_ONLY_PROVENANCE: 0,
    REFUSED: 0,
    FAILED: 0,
    total: 0,
  };
}

async function writeProvenanceRow(input: {
  prisma: PrismaClient;
  batchId: string;
  row: RowExecutionPlan;
  userId: string | null;
  profileId: string | null;
  proposedAction: string;
}): Promise<void> {
  await input.prisma.legacyImportRow.create({
    data: {
      batchId: input.batchId,
      sourceRowNumber: input.row.sourceRowNumber,
      sourceRowHash: input.row.sourceRowHash,
      classification: input.row.classification,
      proposedAction: input.proposedAction,
      emailFingerprint: input.row.emailFingerprint,
      phoneNormalized: input.row.phoneNormalized,
      userId: input.userId,
      profileId: input.profileId,
      warnings: input.row.warnings,
      manualReviewReason: input.row.manualReviewReason,
      maskedPreview: input.row.maskedPreview,
    },
  });
}

/**
 * Execute a validated plan. Caller must already enforce env/authorization gates.
 */
export async function executeMigrationPlan(
  input: ExecuteMigrationInput,
): Promise<BatchExecutionResult> {
  const { prisma, auth, plan } = input;
  const summary = emptySummary();
  const results: RowExecutionResult[] = [];

  const batch = await prisma.legacyImportBatch.create({
    data: {
      batchKey: input.batchKey,
      sourceFilename: input.sourceFilename,
      sourceSha256: plan.sourceSha256,
      mode: "IMPORT",
      environment: input.environment,
      summary: {},
    },
  });

  for (const row of plan.rows) {
    const stagesCompleted: StageName[] = [];
    const mark = (stage: StageName) => {
      stagesCompleted.push(stage);
      input.onStage?.(stage, row);
    };

    try {
      if (row.proposedAction === "SKIP_ALREADY_IMPORTED") {
        results.push({
          sourceRowNumber: row.sourceRowNumber,
          sourceRowHash: row.sourceRowHash,
          proposedAction: row.proposedAction,
          outcome: "SKIP_ALREADY_IMPORTED",
          userId: null,
          profileId: null,
          stagesCompleted,
          error: null,
          businessCandidate: row.businessCandidate,
        });
        summary.SKIP_ALREADY_IMPORTED += 1;
        continue;
      }

      if (
        row.proposedAction === "AMBIGUOUS" ||
        row.proposedAction === "INVALID" ||
        row.proposedAction === "MANUAL_REVIEW" ||
        row.validationErrors.length > 0
      ) {
        results.push({
          sourceRowNumber: row.sourceRowNumber,
          sourceRowHash: row.sourceRowHash,
          proposedAction: row.proposedAction,
          outcome: "REFUSED",
          userId: null,
          profileId: null,
          stagesCompleted,
          error: row.validationErrors.join("; ") || row.manualReviewReason || row.proposedAction,
          businessCandidate: row.businessCandidate,
        });
        summary.REFUSED += 1;
        continue;
      }

      if (row.proposedAction === "GAP_ONLY" || row.proposedAction === "MATCH_EXISTING") {
        // Provenance only — never overwrite current member fields.
        const existing = await prisma.legacyImportRow.findFirst({
          where: {
            sourceRowHash: row.sourceRowHash,
            profileId: { not: null },
            proposedAction: { in: ["CREATE", "GAP_ONLY", "MATCH_EXISTING", "SKIP_ALREADY_IMPORTED"] },
          },
        });
        if (existing?.profileId) {
          results.push({
            sourceRowNumber: row.sourceRowNumber,
            sourceRowHash: row.sourceRowHash,
            proposedAction: "SKIP_ALREADY_IMPORTED",
            outcome: "SKIP_ALREADY_IMPORTED",
            userId: existing.userId,
            profileId: existing.profileId,
            stagesCompleted,
            error: null,
            businessCandidate: row.businessCandidate,
          });
          summary.SKIP_ALREADY_IMPORTED += 1;
          continue;
        }

        // Resolve existing member via email/phone from mapped plan (read-only lookup).
        const email = row.mapped?.email;
        const phone = row.mapped?.phone ?? row.phoneNormalized;
        const user =
          (email
            ? await prisma.user.findFirst({
                where: { email, deletedAt: null },
                include: { profile: true },
              })
            : null) ??
          (phone
            ? await prisma.user.findFirst({
                where: { phone, deletedAt: null },
                include: { profile: true },
              })
            : null);

        if (!user?.profile) {
          results.push({
            sourceRowNumber: row.sourceRowNumber,
            sourceRowHash: row.sourceRowHash,
            proposedAction: row.proposedAction,
            outcome: "FAILED",
            userId: null,
            profileId: null,
            stagesCompleted,
            error: "GAP_ONLY: existing member/profile not found",
            businessCandidate: row.businessCandidate,
          });
          summary.FAILED += 1;
          continue;
        }

        mark("provenance");
        await writeProvenanceRow({
          prisma,
          batchId: batch.id,
          row,
          userId: user.id,
          profileId: user.profile.id,
          proposedAction: "GAP_ONLY",
        });

        results.push({
          sourceRowNumber: row.sourceRowNumber,
          sourceRowHash: row.sourceRowHash,
          proposedAction: row.proposedAction,
          outcome: "GAP_ONLY_PROVENANCE",
          userId: user.id,
          profileId: user.profile.id,
          stagesCompleted,
          error: null,
          businessCandidate: row.businessCandidate,
        });
        summary.GAP_ONLY_PROVENANCE += 1;
        continue;
      }

      if (row.proposedAction !== "CREATE" || !row.mapped) {
        results.push({
          sourceRowNumber: row.sourceRowNumber,
          sourceRowHash: row.sourceRowHash,
          proposedAction: row.proposedAction,
          outcome: "REFUSED",
          userId: null,
          profileId: null,
          stagesCompleted,
          error: "CREATE requires mapped payload",
          businessCandidate: row.businessCandidate,
        });
        summary.REFUSED += 1;
        continue;
      }

      // Idempotency: already linked provenance?
      const prior = await prisma.legacyImportRow.findFirst({
        where: {
          sourceRowHash: row.sourceRowHash,
          profileId: { not: null },
          proposedAction: { in: ["CREATE", "GAP_ONLY", "MATCH_EXISTING", "SKIP_ALREADY_IMPORTED"] },
        },
      });
      if (prior?.profileId) {
        results.push({
          sourceRowNumber: row.sourceRowNumber,
          sourceRowHash: row.sourceRowHash,
          proposedAction: "SKIP_ALREADY_IMPORTED",
          outcome: "SKIP_ALREADY_IMPORTED",
          userId: prior.userId,
          profileId: prior.profileId,
          stagesCompleted,
          error: null,
          businessCandidate: row.businessCandidate,
        });
        summary.SKIP_ALREADY_IMPORTED += 1;
        continue;
      }

      const mapped = row.mapped;
      if (
        mapped.verificationStatus !== "NOT_REVIEWED" ||
        mapped.visibilityStatus !== "PRIVATE" ||
        mapped.createConsent ||
        mapped.createBusiness ||
        mapped.createSpotlightRecord
      ) {
        throw new Error("State invariant broken in mapped payload");
      }

      // --- AUTH FIRST ---
      mark("auth");
      const authResult = await auth.createUserWithoutPassword(mapped.email);
      if (!authResult.ok) {
        results.push({
          sourceRowNumber: row.sourceRowNumber,
          sourceRowHash: row.sourceRowHash,
          proposedAction: row.proposedAction,
          outcome: "FAILED",
          userId: null,
          profileId: null,
          stagesCompleted,
          error: authResult.message,
          businessCandidate: row.businessCandidate,
        });
        summary.FAILED += 1;
        continue;
      }
      const userId = authResult.userId;

      mark("user");
      await prisma.user.upsert({
        where: { id: userId },
        create: {
          id: userId,
          email: mapped.email,
          phone: mapped.phone,
        },
        update: {
          email: mapped.email,
          phone: mapped.phone,
        },
      });

      mark("role");
      const memberRole = await prisma.role.findUnique({ where: { name: "MEMBER" } });
      if (memberRole) {
        await prisma.userRole.upsert({
          where: { userId_roleId: { userId, roleId: memberRole.id } },
          create: { userId, roleId: memberRole.id },
          update: {},
        });
      }

      // Refuse privilege elevation from historical data
      const elevated = await prisma.userRole.findMany({
        where: {
          userId,
          role: { name: { in: ["EXCO_VIEWER", "EXCO_ADMIN", "SUPER_ADMIN"] } },
        },
      });
      if (elevated.length > 0) {
        throw new Error("Privilege elevation detected — aborting row");
      }

      mark("profile");
      const existingProfile = await prisma.profile.findUnique({ where: { userId } });
      let profileId = existingProfile?.id;

      if (!profileId) {
        const created = await prisma.profile.create({
          data: {
            userId,
            displayName: mapped.displayName,
            bio: mapped.bio,
            professionalSituation: mapped.professionalSituation,
            spotlightInterest: mapped.spotlightInterest,
            profileStatus: "INCOMPLETE",
            verificationStatus: "NOT_REVIEWED",
            visibilityStatus: "PRIVATE",
            legacyImport: true,
            legacySource: LEGACY_SOURCE,
            legacyImportedAt: new Date(),
            legacyBatchId: input.batchKey,
            professionalDetails: {
              create: {
                profession: mapped.profession,
                organisationName: mapped.organisationName,
                linkedinUrl: mapped.linkedinUrl,
                opportunityPreferences: mapped.opportunityPreferences,
              },
            },
            ...(mapped.serviceArea
              ? {
                  churchInformation: {
                    create: { serviceArea: mapped.serviceArea },
                  },
                }
              : {}),
          },
          select: { id: true },
        });
        profileId = created.id;
      } else if (!existingProfile!.legacyImport) {
        // Existing non-legacy profile for this Auth id — provenance-only / fail closed
        results.push({
          sourceRowNumber: row.sourceRowNumber,
          sourceRowHash: row.sourceRowHash,
          proposedAction: row.proposedAction,
          outcome: "FAILED",
          userId,
          profileId,
          stagesCompleted,
          error: "Auth user already has a non-legacy profile — refuse overwrite",
          businessCandidate: row.businessCandidate,
        });
        summary.FAILED += 1;
        continue;
      }

      // Re-read state invariants
      const profile = await prisma.profile.findUniqueOrThrow({
        where: { id: profileId },
        include: {
          verificationRecords: { take: 1 },
          spotlights: { take: 1 },
          businessLinks: { take: 1 },
        },
      });
      if (profile.verificationStatus !== "NOT_REVIEWED") {
        throw new Error("Invariant: verificationStatus must remain NOT_REVIEWED");
      }
      if (profile.visibilityStatus !== "PRIVATE") {
        throw new Error("Invariant: visibilityStatus must remain PRIVATE");
      }
      if (profile.spotlights.length > 0) {
        throw new Error("Invariant: no Spotlight records may be created by import");
      }
      if (profile.businessLinks.length > 0) {
        throw new Error("Invariant: no business relationships may be created by import");
      }

      mark("provenance");
      await writeProvenanceRow({
        prisma,
        batchId: batch.id,
        row,
        userId,
        profileId,
        proposedAction: "CREATE",
      });

      results.push({
        sourceRowNumber: row.sourceRowNumber,
        sourceRowHash: row.sourceRowHash,
        proposedAction: row.proposedAction,
        outcome: "CREATED",
        userId,
        profileId,
        stagesCompleted,
        error: null,
        businessCandidate: row.businessCandidate,
      });
      summary.CREATED += 1;
    } catch (e) {
      results.push({
        sourceRowNumber: row.sourceRowNumber,
        sourceRowHash: row.sourceRowHash,
        proposedAction: row.proposedAction,
        outcome: "FAILED",
        userId: null,
        profileId: null,
        stagesCompleted,
        error: e instanceof Error ? e.message : "unknown",
        businessCandidate: row.businessCandidate,
      });
      summary.FAILED += 1;
    }
  }

  summary.total = results.length;
  await prisma.legacyImportBatch.update({
    where: { id: batch.id },
    data: { summary },
  });

  return {
    batchKey: input.batchKey,
    environment: input.environment,
    mode: "IMPORT",
    summary,
    rows: results,
    stageOrderInvariant: "AUTH_FIRST",
  };
}

/** Assert Auth-first stage ordering for a completed CREATE row. */
export function assertAuthFirstStageOrder(stages: StageName[]): void {
  const required: StageName[] = ["auth", "user", "role", "profile", "provenance"];
  let idx = 0;
  for (const stage of stages) {
    if (stage === required[idx]) idx += 1;
  }
  if (idx !== required.length) {
    throw new Error(`Auth-first ordering violated: saw [${stages.join(",")}]`);
  }
  if (stages.indexOf("profile") < stages.indexOf("auth")) {
    throw new Error("Profile must never precede Auth");
  }
}
