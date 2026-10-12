import { describe, expect, it, vi } from "vitest";
import {
  EXPECTED_PRODUCTION_PROJECT_REF,
  EXPECTED_SOURCE_ROW_COUNT,
  EXPECTED_SOURCE_SHA256,
  PRODUCTION_IMPORT_AUTH_ENV_KEY,
  PRODUCTION_IMPORT_AUTH_PHRASE,
} from "@/features/legacy-migration/constants";
import { assertSourceIntegrity } from "@/features/legacy-migration/source-guard";
import {
  assertLocalMutationAllowed,
  assertProductionMutationAllowed,
  isProductionImportAuthorized,
  reportMigrationCredentialPresence,
} from "@/features/legacy-migration/env-safety";
import {
  assertProductionTargetIdentity,
  extractSupabaseProjectRef,
} from "@/features/legacy-migration/target-safety";
import { buildMigrationExecutionPlan } from "@/features/legacy-migration/plan";
import {
  assertAuthFirstStageOrder,
  executeMigrationPlan,
  type MigrationAuthAdmin,
  type StageName,
} from "@/features/legacy-migration/execute";
import { finalizeCanonicalRow } from "@/features/legacy-migration/map";
import {
  buildEmptyMemberIndex,
  indexAfterSimulatedImport,
} from "@/features/legacy-migration/dry-run";
import { normalizePhone } from "@/features/registration/phone";
import type { CanonicalLegacyRow } from "@/features/legacy-migration/types";

function baseRow(over: Partial<CanonicalLegacyRow> = {}): CanonicalLegacyRow {
  return finalizeCanonicalRow({
    sourceRowNumber: 2,
    emailRaw: "person@example.com",
    fullName: "Ada Example",
    preferredName: "Ada",
    phoneRaw: "08012345678",
    linkedinRaw: "https://www.linkedin.com/in/ada",
    categoryRaw: "Employee / Corporate Professional",
    jobTitle: "Engineer",
    industryRaw: null,
    organisationRaw: "Acme",
    yearsBucket: "3–5 years",
    servicesRaw: null,
    skillsRaw: null,
    bioRaw: "A short bio that is useful.",
    churchDepartment: "Choir",
    spotlightInterestRaw: "Yes",
    businessName: null,
    directoryConsentRaw: "Yes",
    whatsappConsentRaw: "Yes",
    referralsRaw: "Yes",
    collaborationRaw: "Yes",
    mentorshipRaw: "No",
    historicalOnly: {},
    ...over,
  });
}

describe("Phase 18A source integrity", () => {
  it("accepts authoritative hash/sheet/count", () => {
    expect(
      assertSourceIntegrity({
        sha256: EXPECTED_SOURCE_SHA256,
        authoritativeSheet: "Form responses 1",
        rowCount: EXPECTED_SOURCE_ROW_COUNT,
      }).ok,
    ).toBe(true);
  });

  it("denies wrong SHA / count / sheet", () => {
    expect(
      assertSourceIntegrity({
        sha256: "DEADBEEF",
        authoritativeSheet: "Form responses 1",
        rowCount: 18,
      }).ok,
    ).toBe(false);
    expect(
      assertSourceIntegrity({
        sha256: EXPECTED_SOURCE_SHA256,
        authoritativeSheet: "Dashboard",
        rowCount: 18,
      }).ok,
    ).toBe(false);
    expect(
      assertSourceIntegrity({
        sha256: EXPECTED_SOURCE_SHA256,
        authoritativeSheet: "Form responses 1",
        rowCount: 17,
      }).ok,
    ).toBe(false);
  });
});

describe("Phase 18A authorization fail-closed", () => {
  it("defaults to DENY", () => {
    expect(isProductionImportAuthorized({})).toBe(false);
    expect(isProductionImportAuthorized({ [PRODUCTION_IMPORT_AUTH_ENV_KEY]: "" })).toBe(false);
    expect(isProductionImportAuthorized({ [PRODUCTION_IMPORT_AUTH_ENV_KEY]: "yes" })).toBe(false);
    expect(
      isProductionImportAuthorized({
        [PRODUCTION_IMPORT_AUTH_ENV_KEY]: PRODUCTION_IMPORT_AUTH_PHRASE + " ",
      }),
    ).toBe(false);
  });

  it("accepts only exact governance phrase", () => {
    expect(
      isProductionImportAuthorized({
        [PRODUCTION_IMPORT_AUTH_ENV_KEY]: PRODUCTION_IMPORT_AUTH_PHRASE,
      }),
    ).toBe(true);
  });

  it("denies Production mutation without auth / creds / wrong target", () => {
    expect(() =>
      assertProductionMutationAllowed({
        env: {},
        importDatabaseUrl: `postgresql://u:p@db.${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
        importServiceRoleKey: "role",
        importSupabaseUrl: `https://${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`,
      }),
    ).toThrow(/denied/);

    expect(() =>
      assertProductionMutationAllowed({
        env: { [PRODUCTION_IMPORT_AUTH_ENV_KEY]: PRODUCTION_IMPORT_AUTH_PHRASE },
        importDatabaseUrl: undefined,
        importServiceRoleKey: "role",
        importSupabaseUrl: `https://${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`,
      }),
    ).toThrow(/PHASE18_IMPORT_DATABASE_URL/);

    expect(() =>
      assertProductionMutationAllowed({
        env: { [PRODUCTION_IMPORT_AUTH_ENV_KEY]: PRODUCTION_IMPORT_AUTH_PHRASE },
        importDatabaseUrl: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
        importServiceRoleKey: "role",
        importSupabaseUrl: `https://${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`,
      }),
    ).toThrow(/expected production/);

    expect(() =>
      assertProductionMutationAllowed({
        env: {
          [PRODUCTION_IMPORT_AUTH_ENV_KEY]: PRODUCTION_IMPORT_AUTH_PHRASE,
          PHASE18_PRODUCTION_PROJECT_REF: "wrongprojectref00001",
        },
        importDatabaseUrl: `postgresql://u:p@db.wrongprojectref00001.supabase.co:5432/postgres`,
        importServiceRoleKey: "role",
        importSupabaseUrl: "https://wrongprojectref00001.supabase.co",
      }),
    ).toThrow(/project ref mismatch/);
  });

  it("allows Production gate only when all signals align (still not executed in 18A)", () => {
    expect(() =>
      assertProductionMutationAllowed({
        env: { [PRODUCTION_IMPORT_AUTH_ENV_KEY]: PRODUCTION_IMPORT_AUTH_PHRASE },
        importDatabaseUrl: `postgresql://u:p@db.${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
        importServiceRoleKey: "service-role-placeholder",
        importSupabaseUrl: `https://${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`,
      }),
    ).not.toThrow();
  });

  it("local path still aborts if production phrase is smuggled", () => {
    expect(() =>
      assertLocalMutationAllowed({
        databaseUrl: "postgresql://postgres:postgres@localhost:54322/postgres",
        explicitMutateFlag: true,
        productionAuthPhrase: PRODUCTION_IMPORT_AUTH_PHRASE,
      }),
    ).toThrow(/PRODUCTION IMPORT GATE/);
  });

  it("credentials alone do not authorize", () => {
    const presence = reportMigrationCredentialPresence({
      PHASE18_IMPORT_DATABASE_URL: "postgresql://x@db.example.supabase.co/postgres",
      PHASE18_IMPORT_SERVICE_ROLE_KEY: "x",
      PHASE18_IMPORT_SUPABASE_URL: "https://x.supabase.co",
    });
    expect(presence.PHASE18_IMPORT_DATABASE_URL).toBe("PRESENT");
    expect(isProductionImportAuthorized(presence as never)).toBe(false);
    expect(isProductionImportAuthorized({})).toBe(false);
  });
});

describe("Phase 18A target safety", () => {
  it("extracts project ref from hosted URLs", () => {
    expect(
      extractSupabaseProjectRef(`https://${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`),
    ).toBe(EXPECTED_PRODUCTION_PROJECT_REF);
    expect(
      extractSupabaseProjectRef(
        `postgresql://postgres:x@db.${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
      ),
    ).toBe(EXPECTED_PRODUCTION_PROJECT_REF);
  });

  it("denies wrong target / missing ref in URLs", () => {
    expect(
      assertProductionTargetIdentity({
        projectRefEnv: "otherref000000000001",
      }).ok,
    ).toBe(false);
    expect(
      assertProductionTargetIdentity({
        importDatabaseUrl: "postgresql://u:p@db.otherref000000000001.supabase.co:5432/postgres",
        importSupabaseUrl: "https://otherref000000000001.supabase.co",
      }).ok,
    ).toBe(false);
    expect(
      assertProductionTargetIdentity({
        importDatabaseUrl: "postgresql://u:p@db.amazonaws.com:5432/postgres",
        importSupabaseUrl: "https://example.com",
      }).ok,
    ).toBe(false);
  });

  it("accepts expected Production ref in URLs", () => {
    const r = assertProductionTargetIdentity({
      importDatabaseUrl: `postgresql://u:p@db.${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`,
      importSupabaseUrl: `https://${EXPECTED_PRODUCTION_PROJECT_REF}.supabase.co`,
    });
    expect(r.ok).toBe(true);
  });
});

describe("Phase 18A plan parity + phone regression", () => {
  it("plans CREATE and second-pass SKIP from same pipeline", () => {
    const rows = [
      baseRow(),
      finalizeCanonicalRow({
        sourceRowNumber: 3,
        emailRaw: "other@example.com",
        fullName: "Other Person",
        preferredName: null,
        phoneRaw: "08112345678",
        linkedinRaw: null,
        categoryRaw: "Other",
        jobTitle: "Artist",
        industryRaw: null,
        organisationRaw: "Studio",
        yearsBucket: null,
        servicesRaw: null,
        skillsRaw: null,
        bioRaw: null,
        churchDepartment: null,
        spotlightInterestRaw: "No",
        businessName: "Biz Co",
        directoryConsentRaw: "Yes",
        whatsappConsentRaw: "Yes",
        historicalOnly: {},
      }),
    ];

    // Bypass source integrity for fixture rows (not full 18-row file)
    const pass1 = buildMigrationExecutionPlan({
      sourceSha256: "AAA",
      authoritativeSheet: "Form responses 1",
      rows,
      memberIndex: buildEmptyMemberIndex(),
      enforceSourceIntegrity: false,
    });
    expect(pass1.summary.CREATE).toBe(2);
    expect(pass1.rows.every((r) => r.authAction === "CREATE_AUTH_USER")).toBe(true);
    expect(pass1.rows.every((r) => r.expectedVerificationStatus === "NOT_REVIEWED")).toBe(true);
    expect(pass1.rows.every((r) => r.expectedVisibilityStatus === "PRIVATE")).toBe(true);
    expect(pass1.rows.every((r) => r.createBusiness === false)).toBe(true);
    expect(pass1.rows.some((r) => r.businessCandidate)).toBe(true);

    const pass2 = buildMigrationExecutionPlan({
      sourceSha256: "AAA",
      authoritativeSheet: "Form responses 1",
      rows,
      memberIndex: indexAfterSimulatedImport(
        buildEmptyMemberIndex(),
        pass1.rows.map((r) => ({
          sourceRowNumber: r.sourceRowNumber,
          sourceRowHash: r.sourceRowHash,
          emailFingerprint: r.emailFingerprint,
          phoneNormalized: r.phoneNormalized,
          classification: r.classification as never,
          proposedAction: r.proposedAction,
          warnings: r.warnings,
          manualReviewReason: r.manualReviewReason,
          maskedPreview: r.maskedPreview,
          mapped: r.mapped,
          excludedFromCurrentState: [],
        })),
      ),
      enforceSourceIntegrity: false,
    });
    expect(pass2.summary.SKIP_ALREADY_IMPORTED).toBe(2);
    expect(pass2.rows.every((r) => r.authAction === "NONE")).toBe(true);
  });

  it("ZA-first defect cannot return: NG local → 234", () => {
    expect(normalizePhone("08143395949")).toBe("2348143395949");
    expect(normalizePhone("08143395949")).not.toMatch(/^27/);
    expect(normalizePhone("+27821234567")).toBe("27821234567");
  });
});

describe("Phase 18A Auth-first executor (mock)", () => {
  function makeFakePrisma() {
    const users = new Map<string, { id: string; email: string; phone: string | null }>();
    const profiles = new Map<
      string,
      {
        id: string;
        userId: string;
        verificationStatus: string;
        visibilityStatus: string;
        legacyImport: boolean;
      }
    >();
    const legacyRows: Array<{ sourceRowHash: string; profileId: string | null; userId: string | null; proposedAction: string }> =
      [];
    let batchId = "batch-1";

    const prisma = {
      legacyImportBatch: {
        create: vi.fn(async ({ data }: { data: { batchKey: string } }) => {
          batchId = data.batchKey;
          return { id: batchId };
        }),
        update: vi.fn(async () => ({})),
      },
      legacyImportRow: {
        findFirst: vi.fn(async ({ where }: { where: { sourceRowHash: string } }) => {
          const hit = legacyRows.find(
            (r) => r.sourceRowHash === where.sourceRowHash && r.profileId,
          );
          return hit
            ? {
                profileId: hit.profileId,
                userId: hit.userId,
                proposedAction: hit.proposedAction,
              }
            : null;
        }),
        create: vi.fn(
          async ({
            data,
          }: {
            data: {
              sourceRowHash: string;
              profileId: string | null;
              userId: string | null;
              proposedAction: string;
            };
          }) => {
            legacyRows.push({
              sourceRowHash: data.sourceRowHash,
              profileId: data.profileId,
              userId: data.userId,
              proposedAction: data.proposedAction,
            });
            return { id: `row-${legacyRows.length}` };
          },
        ),
      },
      user: {
        upsert: vi.fn(
          async ({
            where,
            create,
          }: {
            where: { id: string };
            create: { id: string; email: string; phone: string | null };
          }) => {
            users.set(where.id, create);
            return create;
          },
        ),
        findFirst: vi.fn(async () => null),
      },
      role: {
        findUnique: vi.fn(async () => ({ id: "role-member", name: "MEMBER" })),
      },
      userRole: {
        upsert: vi.fn(async () => ({})),
        findMany: vi.fn(async () => []),
      },
      profile: {
        findUnique: vi.fn(async ({ where }: { where: { userId?: string; id?: string } }) => {
          if (where.userId) {
            for (const p of profiles.values()) {
              if (p.userId === where.userId) return p;
            }
            return null;
          }
          if (where.id) return profiles.get(where.id) ?? null;
          return null;
        }),
        findUniqueOrThrow: vi.fn(async ({ where }: { where: { id: string } }) => {
          const p = profiles.get(where.id);
          if (!p) throw new Error("missing");
          return {
            ...p,
            verificationRecords: [],
            spotlights: [],
            businessLinks: [],
          };
        }),
        create: vi.fn(
          async ({
            data,
          }: {
            data: {
              userId: string;
              verificationStatus: string;
              visibilityStatus: string;
              legacyImport: boolean;
            };
            select: { id: true };
          }) => {
            const id = `profile-${profiles.size + 1}`;
            profiles.set(id, {
              id,
              userId: data.userId,
              verificationStatus: data.verificationStatus,
              visibilityStatus: data.visibilityStatus,
              legacyImport: data.legacyImport,
            });
            return { id };
          },
        ),
      },
    };

    return { prisma: prisma as never, users, profiles, legacyRows };
  }

  it("enforces Auth → user → role → profile → provenance order", async () => {
    const stages: StageName[] = [];
    const { prisma } = makeFakePrisma();
    const auth: MigrationAuthAdmin = {
      createUserWithoutPassword: async () => ({
        ok: true,
        userId: "auth-user-1",
        created: true,
      }),
    };

    const plan = buildMigrationExecutionPlan({
      sourceSha256: "AAA",
      authoritativeSheet: "Form responses 1",
      rows: [baseRow()],
      enforceSourceIntegrity: false,
    });

    const result = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey: "test-batch",
      environment: "local",
      sourceFilename: "fixture.xlsx",
      onStage: (s) => stages.push(s),
    });

    expect(result.summary.CREATED).toBe(1);
    expect(result.stageOrderInvariant).toBe("AUTH_FIRST");
    assertAuthFirstStageOrder(stages);
    expect(stages.indexOf("profile")).toBeGreaterThan(stages.indexOf("auth"));
  });

  it("second run skips already imported (idempotent)", async () => {
    const { prisma } = makeFakePrisma();
    let authCalls = 0;
    const auth: MigrationAuthAdmin = {
      createUserWithoutPassword: async () => {
        authCalls += 1;
        return { ok: true, userId: `auth-${authCalls}`, created: true };
      },
    };
    const plan = buildMigrationExecutionPlan({
      sourceSha256: "AAA",
      authoritativeSheet: "Form responses 1",
      rows: [baseRow()],
      enforceSourceIntegrity: false,
    });

    const first = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey: "batch-a",
      environment: "local",
      sourceFilename: "fixture.xlsx",
    });
    expect(first.summary.CREATED).toBe(1);

    const second = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey: "batch-b",
      environment: "local",
      sourceFilename: "fixture.xlsx",
    });
    expect(second.summary.SKIP_ALREADY_IMPORTED).toBe(1);
    expect(authCalls).toBe(1);

    const third = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey: "batch-c",
      environment: "local",
      sourceFilename: "fixture.xlsx",
    });
    expect(third.summary.SKIP_ALREADY_IMPORTED).toBe(1);
    expect(authCalls).toBe(1);
  });

  it("refuses ambiguous rows without creating Auth", async () => {
    const { prisma } = makeFakePrisma();
    let authCalls = 0;
    const auth: MigrationAuthAdmin = {
      createUserWithoutPassword: async () => {
        authCalls += 1;
        return { ok: true, userId: "x", created: true };
      },
    };
    const plan = buildMigrationExecutionPlan({
      sourceSha256: "AAA",
      authoritativeSheet: "Form responses 1",
      rows: [
        baseRow({ emailRaw: "dup@example.com" }),
        finalizeCanonicalRow({
          sourceRowNumber: 3,
          emailRaw: "dup@example.com",
          fullName: "Other",
          preferredName: null,
          phoneRaw: "08199999999",
          linkedinRaw: null,
          categoryRaw: "Other",
          jobTitle: "X",
          industryRaw: null,
          organisationRaw: "Y",
          yearsBucket: null,
          servicesRaw: null,
          skillsRaw: null,
          bioRaw: null,
          churchDepartment: null,
          spotlightInterestRaw: "No",
          businessName: null,
          directoryConsentRaw: "Yes",
          whatsappConsentRaw: "Yes",
          historicalOnly: {},
        }),
      ],
      enforceSourceIntegrity: false,
    });
    expect(plan.rows.every((r) => r.proposedAction === "AMBIGUOUS")).toBe(true);
    const result = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey: "ambig",
      environment: "local",
      sourceFilename: "fixture.xlsx",
    });
    expect(result.summary.REFUSED).toBe(2);
    expect(authCalls).toBe(0);
  });

  it("handles Auth failure without creating profile", async () => {
    const { prisma, profiles } = makeFakePrisma();
    const auth: MigrationAuthAdmin = {
      createUserWithoutPassword: async () => ({
        ok: false,
        duplicate: false,
        message: "auth down",
      }),
    };
    const plan = buildMigrationExecutionPlan({
      sourceSha256: "AAA",
      authoritativeSheet: "Form responses 1",
      rows: [baseRow()],
      enforceSourceIntegrity: false,
    });
    const result = await executeMigrationPlan({
      prisma,
      auth,
      plan,
      batchKey: "auth-fail",
      environment: "local",
      sourceFilename: "fixture.xlsx",
    });
    expect(result.summary.FAILED).toBe(1);
    expect(profiles.size).toBe(0);
    expect(result.rows[0].stagesCompleted).toEqual(["auth"]);
  });
});
