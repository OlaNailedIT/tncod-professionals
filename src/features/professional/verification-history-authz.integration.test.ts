/**
 * F-002 — verification-history notes are Admin+ (professional.verify).
 * Viewer retains operational timeline metadata without notes.
 * Requires disposable DATABASE_URL. Uses visible Vitest skip — never silent PASS.
 */
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it, type TestContext } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";
import {
  applyExcoProfessionalDecision,
  loadProfessionalVerificationHistory,
} from "@/features/professional/exco-review";
import { submitProfile } from "@/features/professional/submit-profile";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "@/features/profile/completion";

const prisma = new PrismaClient();
const TAG = `f002-hist-${Date.now()}`;
const SECRET_NOTE = `ADMIN-ONLY-NOTE-${TAG}`;

let dbReady = false;

function requireDisposableDb(ctx: TestContext): void {
  if (!dbReady) {
    ctx.skip();
  }
}

async function grantRole(
  userId: string,
  roleName: "MEMBER" | "EXCO_VIEWER" | "EXCO_ADMIN" | "SUPER_ADMIN",
) {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
}

async function createCompleteUser(email: string, displayName: string) {
  const id = randomUUID();
  const industry = await prisma.industry.upsert({
    where: { slug: "technology" },
    create: { name: "Technology", slug: "technology", isActive: true },
    update: {},
  });

  await prisma.user.create({
    data: {
      id,
      email,
      phone: null,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName,
          location: "Lagos",
          bio: "Bio text that is long enough for completion.",
          professionalSituation: "Employee",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          clarificationMessage: null,
          professionalDetails: {
            create: {
              profession: "Engineer",
              yearsExperience: 5,
              linkedinUrl: "https://www.linkedin.com/in/example",
              lookingForSummary: "Peers",
              offeringSummary: "Help",
              opportunityPreferences: {
                collaboration: true,
                mentorship: true,
                referrals: true,
                training: true,
              },
              industryId: industry.id,
            },
          },
          churchInformation: { create: { serviceArea: "Lagos" } },
          experiences: { create: [{ role: "Engineer", organisation: "TNCOD" }] },
        },
      },
    },
  });

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  const skill = await prisma.skill.create({
    data: {
      name: `Skill ${id.slice(0, 8)}`,
      slug: `f002-${id.slice(0, 8)}-skill`,
      isActive: true,
    },
  });
  const service = await prisma.service.create({
    data: {
      name: `Svc ${id.slice(0, 8)}`,
      slug: `f002-${id.slice(0, 8)}-svc`,
      isActive: true,
    },
  });
  await prisma.profileSkill.create({ data: { profileId: profile.id, skillId: skill.id } });
  await prisma.profileService.create({
    data: { profileId: profile.id, serviceId: service.id },
  });
  await grantRole(id, "MEMBER");

  const loaded = await prisma.profile.findUniqueOrThrow({
    where: { id: profile.id },
    include: {
      professionalDetails: { include: { industry: true } },
      churchInformation: true,
      experiences: { take: 1 },
      profileSkills: { include: { skill: true } },
      profileServices: { include: { service: true } },
      businessLinks: { include: { business: { include: { industry: true } } } },
    },
  });
  const pd = loaded.professionalDetails;
  const pct = calculateProfileCompletion(
    toCompletionInput({
      displayName: loaded.displayName,
      hasHeadshot: Boolean(loaded.profileImageStorageKey),
      location: loaded.location,
      bio: loaded.bio,
      profession: pd?.profession ?? null,
      industryName: pd?.industry?.name ?? null,
      yearsExperience: pd?.yearsExperience ?? null,
      hasExperienceRows: loaded.experiences.length > 0,
      skillNames: loaded.profileSkills.map((s) => s.skill.name),
      serviceNames: loaded.profileServices.map((s) => s.service.name),
      linkedinUrl: pd?.linkedinUrl ?? null,
      serviceArea: loaded.churchInformation?.serviceArea ?? null,
      lookingForSummary: pd?.lookingForSummary ?? null,
      offeringSummary: pd?.offeringSummary ?? null,
      opportunityPreferences: normalizeOpportunityPreferences(pd?.opportunityPreferences),
      professionalSituation: loaded.professionalSituation,
      businessLinks: loaded.businessLinks.map((l) => ({
        name: l.business.name,
        industryName: l.business.industry?.name ?? null,
        description: l.business.description,
      })),
    }),
  ).percent;
  expect(pct).toBe(100);

  return { userId: id, profileId: profile.id };
}

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch {
    dbReady = false;
  }
});

describe("F-002 verification history notes authorization", () => {
  it("reports disposable DB readiness", () => {
    if (!dbReady) {
      expect(dbReady).toBe(false);
      return;
    }
    expect(dbReady).toBe(true);
  });

  it(
    "EXCO_VIEWER receives timeline without notes; Admin/Super retain notes",
    async (ctx) => {
      requireDisposableDb(ctx);

      const subject = await createCompleteUser(`${TAG}-subj@example.com`, `${TAG} Subject`);
      const submit = await submitProfile(subject.userId);
      expect(submit.ok).toBe(true);

      const admin = await createCompleteUser(`${TAG}-admin@example.com`, `${TAG} Admin`);
      await grantRole(admin.userId, "EXCO_ADMIN");
      const viewer = await createCompleteUser(`${TAG}-viewer@example.com`, `${TAG} Viewer`);
      await grantRole(viewer.userId, "EXCO_VIEWER");
      const superAdmin = await createCompleteUser(`${TAG}-super@example.com`, `${TAG} Super`);
      await grantRole(superAdmin.userId, "SUPER_ADMIN");

      await applyExcoProfessionalDecision({
        reviewerUserId: admin.userId,
        profileId: subject.profileId,
        action: "start_review",
      });
      const clarified = await applyExcoProfessionalDecision({
        reviewerUserId: admin.userId,
        profileId: subject.profileId,
        action: "request_clarification",
        memberFacingMessage: SECRET_NOTE,
      });
      expect(clarified.ok).toBe(true);

      const stored = await prisma.verificationRecord.findFirst({
        where: { profileId: subject.profileId, notes: SECRET_NOTE },
      });
      expect(stored).toBeTruthy();

      const viewerHistory = await loadProfessionalVerificationHistory(
        viewer.userId,
        subject.profileId,
      );
      expect(viewerHistory.length).toBeGreaterThan(0);
      expect(
        viewerHistory.some(
          (h) => h.decision === "REQUEST_CLARIFICATION" || h.processStatus.length > 0,
        ),
      ).toBe(true);
      for (const h of viewerHistory) {
        expect(h.notes).toBeNull();
        expect(JSON.stringify(h)).not.toContain(SECRET_NOTE);
      }

      const adminHistory = await loadProfessionalVerificationHistory(
        admin.userId,
        subject.profileId,
      );
      expect(adminHistory.some((h) => h.notes === SECRET_NOTE)).toBe(true);

      const superHistory = await loadProfessionalVerificationHistory(
        superAdmin.userId,
        subject.profileId,
      );
      expect(superHistory.some((h) => h.notes === SECRET_NOTE)).toBe(true);
    },
    120_000,
  );

  it("MEMBER and anonymous are denied privileged verification history", async (ctx) => {
    requireDisposableDb(ctx);

    const subject = await createCompleteUser(`${TAG}-deny-s@example.com`, `${TAG} DenyS`);
    await submitProfile(subject.userId);
    const member = await createCompleteUser(`${TAG}-deny-m@example.com`, `${TAG} DenyM`);

    await expect(
      loadProfessionalVerificationHistory(member.userId, subject.profileId),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      loadProfessionalVerificationHistory(randomUUID(), subject.profileId),
    ).rejects.toBeInstanceOf(AppError);
  }, 60_000);
});
