/**
 * Phase 12 command-boundary evidence.
 * Exercises real domain commands (not UI). Requires local DATABASE_URL.
 * Skips when the disposable DB is unavailable — that is an infrastructure failure, not a PASS.
 */
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { submitProfile } from "@/features/professional/submit-profile";
import {
  applyExcoProfessionalDecision,
  publishProfile,
  unpublishProfile,
} from "@/features/professional/exco-review";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "@/features/profile/completion";

const prisma = new PrismaClient();
const TAG = `p12-bound-${Date.now()}`;

let dbReady = false;

async function grantRole(userId: string, roleName: "MEMBER" | "EXCO_VIEWER" | "EXCO_ADMIN") {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
}

async function createUser(email: string, displayName: string, complete: boolean) {
  const id = randomUUID();
  const industry = complete
    ? await prisma.industry.upsert({
        where: { slug: "technology" },
        create: { name: "Technology", slug: "technology", isActive: true },
        update: {},
      })
    : null;

  await prisma.user.create({
    data: {
      id,
      email,
      phone: null,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName,
          location: complete ? "Lagos" : null,
          bio: complete ? "Bio text that is long enough for completion." : null,
          professionalSituation: "Employee",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          clarificationMessage: null,
          professionalDetails: {
            create: {
              profession: complete ? "Engineer" : null,
              yearsExperience: complete ? 5 : null,
              linkedinUrl: complete ? "https://www.linkedin.com/in/example" : null,
              lookingForSummary: complete ? "Peers" : null,
              offeringSummary: complete ? "Help" : null,
              opportunityPreferences: complete
                ? {
                    collaboration: true,
                    mentorship: true,
                    referrals: true,
                    training: true,
                  }
                : {},
              industryId: industry?.id,
            },
          },
          churchInformation: complete ? { create: { serviceArea: "Lagos" } } : undefined,
          experiences: complete
            ? { create: [{ role: "Engineer", organisation: "TNCOD" }] }
            : undefined,
        },
      },
    },
  });

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  if (complete) {
    const skillSlug = `bound-${id.slice(0, 8)}-skill`;
    const serviceSlug = `bound-${id.slice(0, 8)}-svc`;
    const skill = await prisma.skill.create({
      data: { name: `Skill ${id.slice(0, 8)}`, slug: skillSlug, isActive: true },
    });
    const service = await prisma.service.create({
      data: { name: `Svc ${id.slice(0, 8)}`, slug: serviceSlug, isActive: true },
    });
    await prisma.profileSkill.create({ data: { profileId: profile.id, skillId: skill.id } });
    await prisma.profileService.create({
      data: { profileId: profile.id, serviceId: service.id },
    });
  }
  await grantRole(id, "MEMBER");
  return { userId: id, profileId: profile.id };
}

async function completionPercent(profileId: string): Promise<number> {
  const profile = await prisma.profile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      professionalDetails: { include: { industry: true } },
      churchInformation: true,
      experiences: { take: 1 },
      profileSkills: { include: { skill: true } },
      profileServices: { include: { service: true } },
      businessLinks: { include: { business: { include: { industry: true } } } },
    },
  });
  const pd = profile.professionalDetails;
  return calculateProfileCompletion(
    toCompletionInput({
      displayName: profile.displayName,
      hasHeadshot: Boolean(profile.profileImageStorageKey),
      location: profile.location,
      bio: profile.bio,
      profession: pd?.profession ?? null,
      industryName: pd?.industry?.name ?? null,
      yearsExperience: pd?.yearsExperience ?? null,
      hasExperienceRows: profile.experiences.length > 0,
      skillNames: profile.profileSkills.map((s) => s.skill.name),
      serviceNames: profile.profileServices.map((s) => s.service.name),
      linkedinUrl: pd?.linkedinUrl ?? null,
      serviceArea: profile.churchInformation?.serviceArea ?? null,
      lookingForSummary: pd?.lookingForSummary ?? null,
      offeringSummary: pd?.offeringSummary ?? null,
      opportunityPreferences: normalizeOpportunityPreferences(pd?.opportunityPreferences),
      professionalSituation: profile.professionalSituation,
      businessLinks: profile.businessLinks.map((l) => ({
        name: l.business.name,
        industryName: l.business.industry?.name ?? null,
        description: l.business.description,
      })),
    }),
  ).percent;
}

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch {
    dbReady = false;
  }
});

describe("Phase 12 command boundary evidence", () => {
  it("requires local database for boundary evidence", () => {
    if (!dbReady) {
      throw new Error(
        "DATABASE UNAVAILABLE at DATABASE_URL — Phase 12 boundary evidence cannot PASS without disposable Postgres",
      );
    }
    expect(dbReady).toBe(true);
  });

  it("denies incomplete submitProfile at the command boundary", async () => {
    if (!dbReady) return;
    const incomplete = await createUser(`${TAG}-inc@example.com`, `${TAG} Inc`, false);
    expect(await completionPercent(incomplete.profileId)).toBeLessThan(100);
    const result = await submitProfile(incomplete.userId);
    expect(result.ok).toBe(false);
    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: incomplete.profileId } });
    expect(profile.verificationStatus).toBe("NOT_REVIEWED");
    expect(profile.profileStatus).toBe("REGISTERED");
  });

  it("allows 100% complete submitProfile → SUBMITTED + PENDING", async () => {
    if (!dbReady) return;
    const complete = await createUser(`${TAG}-ok@example.com`, `${TAG} Ok`, true);
    expect(await completionPercent(complete.profileId)).toBe(100);
    const result = await submitProfile(complete.userId);
    expect(result.ok).toBe(true);
    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: complete.profileId } });
    expect(profile.profileStatus).toBe("SUBMITTED");
    expect(profile.verificationStatus).toBe("PENDING");
    expect(profile.visibilityStatus).toBe("PRIVATE");
  });

  it("denies EXCO_VIEWER privileged professional mutations at the command boundary", async () => {
    if (!dbReady) return;
    const subject = await createUser(`${TAG}-subj@example.com`, `${TAG} Subj`, true);
    await submitProfile(subject.userId);
    const viewer = await createUser(`${TAG}-viewer@example.com`, `${TAG} Viewer`, false);
    await grantRole(viewer.userId, "EXCO_VIEWER");

    for (const action of ["start_review", "verify", "request_clarification", "reject"] as const) {
      let denied = false;
      try {
        await applyExcoProfessionalDecision({
          reviewerUserId: viewer.userId,
          profileId: subject.profileId,
          action,
          memberFacingMessage: action === "start_review" || action === "verify" ? undefined : "x",
        });
      } catch (err) {
        denied = err instanceof AppError && err.code === "UNAUTHORIZED";
      }
      expect(denied).toBe(true);
    }

    let pubDenied = false;
    try {
      await publishProfile({ actorUserId: viewer.userId, profileId: subject.profileId });
    } catch (err) {
      pubDenied = err instanceof AppError && err.code === "UNAUTHORIZED";
    }
    expect(pubDenied).toBe(true);

    let unpubDenied = false;
    try {
      await unpublishProfile({ actorUserId: viewer.userId, profileId: subject.profileId });
    } catch (err) {
      unpubDenied = err instanceof AppError && err.code === "UNAUTHORIZED";
    }
    expect(unpubDenied).toBe(true);
  });

  it("denies clarification and rejection without reason at the command boundary", async () => {
    if (!dbReady) return;
    const subject = await createUser(`${TAG}-reason@example.com`, `${TAG} Reason`, true);
    await submitProfile(subject.userId);
    const admin = await createUser(`${TAG}-admin@example.com`, `${TAG} Admin`, false);
    await grantRole(admin.userId, "EXCO_ADMIN");

    const started = await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "start_review",
    });
    expect(started.ok).toBe(true);

    const clarify = await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "request_clarification",
      memberFacingMessage: "   ",
    });
    expect(clarify.ok).toBe(false);

    const reject = await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "reject",
      memberFacingMessage: "",
    });
    expect(reject.ok).toBe(false);
  });

  it("ignores client-forged VERIFIED: verify only from UNDER_REVIEW via command", async () => {
    if (!dbReady) return;
    const subject = await createUser(`${TAG}-forge@example.com`, `${TAG} Forge`, true);
    await submitProfile(subject.userId);
    const admin = await createUser(`${TAG}-admin2@example.com`, `${TAG} Admin2`, false);
    await grantRole(admin.userId, "EXCO_ADMIN");

    const forged = await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "verify",
    });
    expect(forged.ok).toBe(false);
    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: subject.profileId } });
    expect(profile.verificationStatus).toBe("PENDING");
  });

  it("denies foreign-record mutation by MEMBER (no EXCO role)", async () => {
    if (!dbReady) return;
    const owner = await createUser(`${TAG}-owner@example.com`, `${TAG} Owner`, true);
    await submitProfile(owner.userId);
    const stranger = await createUser(`${TAG}-stranger@example.com`, `${TAG} Stranger`, false);

    let strangerDenied = false;
    try {
      await applyExcoProfessionalDecision({
        reviewerUserId: stranger.userId,
        profileId: owner.profileId,
        action: "start_review",
      });
    } catch (err) {
      strangerDenied = err instanceof AppError && err.code === "UNAUTHORIZED";
    }
    expect(strangerDenied).toBe(true);
  });

  it("denies guessed UUID mutation for EXCO_ADMIN (NOT_FOUND)", async () => {
    if (!dbReady) return;
    const admin = await createUser(`${TAG}-admin3@example.com`, `${TAG} Admin3`, false);
    await grantRole(admin.userId, "EXCO_ADMIN");
    const guessed = randomUUID();
    let notFound = false;
    try {
      await applyExcoProfessionalDecision({
        reviewerUserId: admin.userId,
        profileId: guessed,
        action: "start_review",
      });
    } catch (err) {
      notFound = err instanceof AppError && err.code === "NOT_FOUND";
    }
    expect(notFound).toBe(true);
  });

  it("keeps professional verification actions from altering business verification", async () => {
    if (!dbReady) return;
    const subject = await createUser(`${TAG}-iso@example.com`, `${TAG} Iso`, true);
    await submitProfile(subject.userId);
    const admin = await createUser(`${TAG}-admin4@example.com`, `${TAG} Admin4`, false);
    await grantRole(admin.userId, "EXCO_ADMIN");

    const biz = await prisma.business.create({
      data: {
        name: `${TAG} Biz`,
        businessStatus: "SUBMITTED",
        visibilityStatus: "PRIVATE",
        professionals: {
          create: { profileId: subject.profileId, relationshipType: "OWNER" },
        },
      },
    });

    await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "start_review",
    });
    await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "verify",
    });
    const after = await prisma.business.findUniqueOrThrow({ where: { id: biz.id } });
    expect(after.businessStatus).toBe("SUBMITTED");

    const profile = await prisma.profile.findUniqueOrThrow({ where: { id: subject.profileId } });
    expect(profile.verificationStatus).toBe("VERIFIED");
    expect(profile.visibilityStatus).toBe("PRIVATE");
  });

  it("denies publish when not VERIFIED; allows when VERIFIED; unpublish keeps VERIFIED", async () => {
    if (!dbReady) return;
    const subject = await createUser(`${TAG}-pub@example.com`, `${TAG} Pub`, true);
    await submitProfile(subject.userId);
    const admin = await createUser(`${TAG}-admin5@example.com`, `${TAG} Admin5`, false);
    await grantRole(admin.userId, "EXCO_ADMIN");

    const early = await publishProfile({
      actorUserId: admin.userId,
      profileId: subject.profileId,
    });
    expect(early.ok).toBe(false);

    await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "start_review",
    });
    await applyExcoProfessionalDecision({
      reviewerUserId: admin.userId,
      profileId: subject.profileId,
      action: "verify",
    });

    const pub = await publishProfile({
      actorUserId: admin.userId,
      profileId: subject.profileId,
    });
    expect(pub.ok).toBe(true);
    let profile = await prisma.profile.findUniqueOrThrow({ where: { id: subject.profileId } });
    expect(profile.visibilityStatus).toBe("DIRECTORY");
    expect(profile.publicSlug).toBeTruthy();
    const slug = profile.publicSlug;

    const unpub = await unpublishProfile({
      actorUserId: admin.userId,
      profileId: subject.profileId,
    });
    expect(unpub.ok).toBe(true);
    profile = await prisma.profile.findUniqueOrThrow({ where: { id: subject.profileId } });
    expect(profile.visibilityStatus).toBe("MEMBERS_ONLY");
    expect(profile.verificationStatus).toBe("VERIFIED");
    expect(profile.publicSlug).toBe(slug);
  });
});
