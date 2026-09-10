import { describe, expect, it } from "vitest";
import { classifyDatabaseUrl, assertLocalMutationAllowed, isProductionImportAuthorized } from "@/features/legacy-migration/env-safety";
import { classifyIdentity, nameOnlyMergeAllowed } from "@/features/legacy-migration/identity";
import {
  classifyLinkedIn,
  mapSituation,
  mapToPlatformPayload,
  finalizeCanonicalRow,
  normalizeEmail,
} from "@/features/legacy-migration/map";
import { computeSourceRowHash } from "@/features/legacy-migration/row-hash";
import {
  buildEmptyMemberIndex,
  indexAfterSimulatedImport,
  runDryRunClassification,
} from "@/features/legacy-migration/dry-run";
import { AUTHORITATIVE_SHEET, REJECTED_SHEETS } from "@/features/legacy-migration/types";
import { isRejectedMemberSourceSheet } from "@/features/legacy-migration/source-parse";
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

describe("Phase 18 source sheet guards", () => {
  it("rejects derived sheets as member sources", () => {
    expect(AUTHORITATIVE_SHEET).toBe("Form responses 1");
    for (const s of REJECTED_SHEETS) {
      expect(isRejectedMemberSourceSheet(s)).toBe(true);
    }
    expect(isRejectedMemberSourceSheet("Form responses 1")).toBe(false);
  });
});

describe("Phase 18 mapping", () => {
  it("maps safe fields and forces NOT_REVIEWED / PRIVATE / no consent", () => {
    const { mapped, warnings } = mapToPlatformPayload(baseRow());
    expect(mapped).toBeTruthy();
    expect(mapped!.verificationStatus).toBe("NOT_REVIEWED");
    expect(mapped!.visibilityStatus).toBe("PRIVATE");
    expect(mapped!.profileStatus).toBe("INCOMPLETE");
    expect(mapped!.createConsent).toBe(false);
    expect(mapped!.createBusiness).toBe(false);
    expect(mapped!.createSpotlightRecord).toBe(false);
    expect(mapped!.yearsExperience).toBeNull();
    expect(mapped!.legacyImport).toBe(true);
    expect(mapped!.professionalSituation).toBe("Employee");
    expect(mapped!.displayName).toBe("Ada");
    expect(warnings.some((w) => /directory consent/i.test(w))).toBe(true);
  });

  it("maps situations with controlled map only", () => {
    expect(mapSituation("Entrepreneur / Business Owner")).toBe("Entrepreneur / business owner");
    expect(mapSituation("Totally Unknown")).toBeNull();
  });

  it("classifies LinkedIn", () => {
    expect(classifyLinkedIn(null).class).toBe("MISSING");
    expect(classifyLinkedIn("I don’t have").class).toBe("INVALID_JUNK");
    expect(classifyLinkedIn("www.linkedin.com/in/ada").class).toBe("NORMALIZABLE_URL");
    expect(classifyLinkedIn("https://www.linkedin.com/in/ada").class).toBe("VALID_URL");
  });

  it("does not auto-create business from Business Name", () => {
    const { mapped, manualReviewReasons } = mapToPlatformPayload(
      baseRow({ businessName: "Ada Bakery" }),
    );
    expect(mapped!.createBusiness).toBe(false);
    expect(manualReviewReasons.some((r) => /Business candidate/i.test(r))).toBe(true);
  });
});

describe("Phase 18 identity", () => {
  it("forbids name-only merge", () => {
    expect(nameOnlyMergeAllowed()).toBe(false);
  });

  it("matches existing by email → GAP_ONLY", () => {
    const r = classifyIdentity({
      emailNormalized: "a@example.com",
      phoneNormalized: "2348012345678",
      fullName: "Ada",
      existingByEmail: {
        userId: "u1",
        profileId: "p1",
        email: "a@example.com",
        phone: null,
        matchedBy: "email",
      },
      existingByPhone: null,
      alreadyImportedHash: false,
      duplicateSourceEmails: false,
      duplicateSourcePhones: false,
    });
    expect(r.proposedAction).toBe("GAP_ONLY");
    expect(r.classification).toBe("MATCHED_TO_EXISTING_MEMBER");
  });

  it("conflicts when email and phone point to different users", () => {
    const r = classifyIdentity({
      emailNormalized: "a@example.com",
      phoneNormalized: "2348012345678",
      fullName: "Ada",
      existingByEmail: {
        userId: "u1",
        profileId: "p1",
        email: "a@example.com",
        phone: null,
        matchedBy: "email",
      },
      existingByPhone: {
        userId: "u2",
        profileId: "p2",
        email: "b@example.com",
        phone: "2348012345678",
        matchedBy: "phone",
      },
      alreadyImportedHash: false,
      duplicateSourceEmails: false,
      duplicateSourcePhones: false,
    });
    expect(r.proposedAction).toBe("AMBIGUOUS");
    expect(r.classification).toBe("CONFLICTING_IDENTITY");
  });

  it("same name alone does not merge (no existing match without email/phone hit)", () => {
    const r = classifyIdentity({
      emailNormalized: "new@example.com",
      phoneNormalized: "2348099999999",
      fullName: "John Smith",
      existingByEmail: null,
      existingByPhone: null,
      alreadyImportedHash: false,
      duplicateSourceEmails: false,
      duplicateSourcePhones: false,
    });
    expect(r.proposedAction).toBe("CREATE");
  });
});

describe("Phase 18 dry-run + idempotency + adversarial", () => {
  it("classifies rows and second pass skips simulated imports", () => {
    const rows = [baseRow(), baseRow({ sourceRowNumber: 3, emailRaw: "other@example.com", phoneRaw: "08112345678" })];
    // re-finalize second row properly
    rows[1] = finalizeCanonicalRow({
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
      businessName: null,
      directoryConsentRaw: "Yes",
      whatsappConsentRaw: "Yes",
      historicalOnly: {},
    });

    const pass1 = runDryRunClassification({
      sourceSha256: "AAA",
      rows,
      memberIndex: buildEmptyMemberIndex(),
    });
    expect(pass1.summary.CREATE).toBe(2);
    expect(pass1.results.every((r) => r.mapped?.verificationStatus === "NOT_REVIEWED")).toBe(true);
    expect(pass1.results.every((r) => r.mapped?.visibilityStatus === "PRIVATE")).toBe(true);

    const pass2 = runDryRunClassification({
      sourceSha256: "AAA",
      rows,
      memberIndex: indexAfterSimulatedImport(buildEmptyMemberIndex(), pass1.results),
    });
    expect(pass2.summary.SKIP_ALREADY_IMPORTED).toBe(2);
  });

  it("Attack: historical verified/publish/consent cannot become platform state", () => {
    const row = baseRow({
      directoryConsentRaw: "Yes",
      whatsappConsentRaw: "Yes",
      historicalOnly: { claimedVerified: "verified" },
    });
    const { mapped } = mapToPlatformPayload(row);
    expect(mapped!.verificationStatus).toBe("NOT_REVIEWED");
    expect(mapped!.visibilityStatus).toBe("PRIVATE");
    expect(mapped!.createConsent).toBe(false);
  });

  it("Attack: Nigerian phones normalize to 234 not 27", () => {
    expect(normalizePhone("08143395949")).toBe("2348143395949");
  });

  it("Attack: source identity changes when email changes", () => {
    const a = computeSourceRowHash({
      sourceSha256: "FILE",
      sourceRowNumber: 2,
      emailNormalized: "a@example.com",
      phoneNormalized: "2348012345678",
      fullName: "Ada",
    });
    const b = computeSourceRowHash({
      sourceSha256: "FILE",
      sourceRowNumber: 2,
      emailNormalized: "b@example.com",
      phoneNormalized: "2348012345678",
      fullName: "Ada",
    });
    expect(a).not.toBe(b);
  });

  it("Attack: production mutate aborts", () => {
    expect(isProductionImportAuthorized()).toBe(false);
    expect(() =>
      assertLocalMutationAllowed({
        databaseUrl: "postgresql://user:pass@db.xxx.supabase.co:5432/postgres",
        explicitMutateFlag: true,
      }),
    ).toThrow(/Refusing migration mutation/);
    expect(() =>
      assertLocalMutationAllowed({
        databaseUrl: "postgresql://postgres:postgres@localhost:54322/postgres",
        explicitMutateFlag: true,
        productionAuthPhrase: "AUTHORIZE PHASE 18 PRODUCTION IMPORT",
      }),
    ).toThrow(/PRODUCTION IMPORT GATE/);
  });

  it("classifies local vs production URLs", () => {
    expect(classifyDatabaseUrl("postgresql://postgres@localhost:54322/postgres")).toBe("local");
    expect(classifyDatabaseUrl("postgresql://x@db.abc.supabase.co:5432/postgres")).toBe("production");
  });
});

describe("Phase 18 email normalize", () => {
  it("normalizes and rejects", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });
});
