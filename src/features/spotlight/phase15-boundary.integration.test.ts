/**
 * Phase 15 Spotlight — command-boundary evidence.
 * Requires local DATABASE_URL. Skips when DB unavailable.
 */
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it, type TestContext } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";
import {
  archiveSpotlight,
  createSpotlight,
  listExistingSpotlights,
  listSpotlightCandidates,
} from "@/features/spotlight/commands";
import { updateOwnSpotlightInterest } from "@/features/spotlight/own-interest";
import { projectSpotlightProfessional } from "@/features/spotlight/profile-mapper";
import { spotlightProfileInclude } from "@/features/spotlight/profile-mapper";

const prisma = new PrismaClient();
const TAG = `p15-bound-${Date.now()}`;

let dbReady = false;
let columnReady = false;

/** Visible Vitest skip — never silent-return into a false PASS. */
function requireDisposableDb(ctx: TestContext): void {
  if (!dbReady || !columnReady) {
    ctx.skip();
  }
}

async function grantRole(userId: string, roleName: "MEMBER" | "EXCO_VIEWER" | "EXCO_ADMIN" | "SUPER_ADMIN") {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
}

async function forceVerifiedEligible(profileId: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles
       SET verification_status = 'VERIFIED'::"VerificationStatus",
           spotlight_interest = true,
           profile_image_storage_key = $1
       WHERE id = $2::uuid`,
      `test-headshots/${userId}.jpg`,
      profileId,
    );
  });
}

async function createEligibleMember(email: string, displayName: string) {
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
          profileStatus: "COMPLETE",
          spotlightInterest: false,
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
      slug: `p15-${id.slice(0, 8)}-skill`,
      isActive: true,
    },
  });
  const service = await prisma.service.create({
    data: {
      name: `Svc ${id.slice(0, 8)}`,
      slug: `p15-${id.slice(0, 8)}-svc`,
      isActive: true,
    },
  });
  await prisma.profileSkill.create({ data: { profileId: profile.id, skillId: skill.id } });
  await prisma.profileService.create({ data: { profileId: profile.id, serviceId: service.id } });
  await grantRole(id, "MEMBER");
  await forceVerifiedEligible(profile.id, id);
  return { userId: id, profileId: profile.id };
}

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
    const col = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'profiles'
           AND column_name = 'spotlight_interest'
       ) AS e`,
    );
    columnReady = col[0]?.e === true;
  } catch {
    dbReady = false;
  }
});

describe("Phase 15 Spotlight command boundary", () => {
  it("reports disposable DB readiness (other cases skip visibly if unavailable)", () => {
    if (!dbReady || !columnReady) {
      expect(dbReady && columnReady).toBe(false);
      return;
    }
    expect(columnReady).toBe(true);
  });

  it(
    "EXCO_ADMIN can create; forged eligibility claims ignored when ineligible",
    async (ctx) => {
      requireDisposableDb(ctx);
      const member = await createEligibleMember(`${TAG}-forge@example.com`, "P15 Forge");
      const admin = await createEligibleMember(`${TAG}-admin@example.com`, "P15 Admin");
      await grantRole(admin.userId, "EXCO_ADMIN");

      await prisma.profile.update({
        where: { id: member.profileId },
        data: { spotlightInterest: false },
      });

      const forged = await createSpotlight({
        actorUserId: admin.userId,
        profileId: member.profileId,
        verified: true,
        profileComplete: true,
        headshotAvailable: true,
        spotlightInterest: true,
      });
      expect(forged.ok).toBe(false);
      if (!forged.ok) expect(forged.code).toBe("NOT_ELIGIBLE");

      await prisma.profile.update({
        where: { id: member.profileId },
        data: { spotlightInterest: true },
      });
      const ok = await createSpotlight({
        actorUserId: admin.userId,
        profileId: member.profileId,
      });
      expect(ok.ok).toBe(true);
    },
    120_000,
  );

  it("denies EXCO_VIEWER create", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-view-t@example.com`, "P15 Viewer Target");
    const viewer = await createEligibleMember(`${TAG}-viewer@example.com`, "P15 Viewer");
    await grantRole(viewer.userId, "EXCO_VIEWER");

    await expect(
      createSpotlight({ actorUserId: viewer.userId, profileId: member.profileId }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("denies MEMBER create", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-mem@example.com`, "P15 Member");
    await expect(
      createSpotlight({ actorUserId: member.userId, profileId: member.profileId }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("enforces one active Spotlight; archive then recreate allowed", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-card@example.com`, "P15 Card");
    const admin = await createEligibleMember(`${TAG}-card-admin@example.com`, "P15 Card Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");

    const first = await createSpotlight({
      actorUserId: admin.userId,
      profileId: member.profileId,
    });
    expect(first.ok).toBe(true);

    const second = await createSpotlight({
      actorUserId: admin.userId,
      profileId: member.profileId,
    });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.code).toBe("ALREADY_SPOTLIGHTED");

    if (first.ok) {
      await archiveSpotlight({ actorUserId: admin.userId, spotlightId: first.spotlightId });
    }
    const third = await createSpotlight({
      actorUserId: admin.userId,
      profileId: member.profileId,
    });
    expect(third.ok).toBe(true);
  });

  it("concurrent create yields at most one active Spotlight", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-race@example.com`, "P15 Race");
    const admin = await createEligibleMember(`${TAG}-race-admin@example.com`, "P15 Race Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");

    const [a, b] = await Promise.all([
      createSpotlight({ actorUserId: admin.userId, profileId: member.profileId }),
      createSpotlight({ actorUserId: admin.userId, profileId: member.profileId }),
    ]);
    const successes = [a, b].filter((r) => r.ok);
    expect(successes.length).toBe(1);

    const active = await prisma.spotlight.count({
      where: { profileId: member.profileId, status: { not: "ARCHIVED" } },
    });
    expect(active).toBe(1);
  });

  it("IDOR: random UUID create fails safely", async (ctx) => {
    requireDisposableDb(ctx);
    const admin = await createEligibleMember(`${TAG}-idor-admin@example.com`, "P15 IDOR Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");
    const result = await createSpotlight({
      actorUserId: admin.userId,
      profileId: randomUUID(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("PROFILE_NOT_FOUND");
  });

  it("interest withdraw archives active Spotlight; no consent rows", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-withdraw@example.com`, "P15 Withdraw");
    const admin = await createEligibleMember(`${TAG}-withdraw-admin@example.com`, "P15 Withdraw Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");

    const created = await createSpotlight({
      actorUserId: admin.userId,
      profileId: member.profileId,
    });
    expect(created.ok).toBe(true);

    await updateOwnSpotlightInterest(member.userId, false);
    const active = await prisma.spotlight.count({
      where: { profileId: member.profileId, status: { not: "ARCHIVED" } },
    });
    expect(active).toBe(0);

    const consents = await prisma.consent.count({ where: { userId: member.userId } });
    expect(consents).toBe(0);
  });

  it("live projection reflects profile name change; no contact/business leak", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-live@example.com`, "P15 Live Before");
    await prisma.profile.update({
      where: { id: member.profileId },
      data: { displayName: "P15 Live After" },
    });
    const profile = await prisma.profile.findUniqueOrThrow({
      where: { id: member.profileId },
      include: spotlightProfileInclude,
    });
    const projection = projectSpotlightProfessional(profile as never);
    expect(projection.displayName).toBe("P15 Live After");
    expect(projection).not.toHaveProperty("email");
    expect(projection).not.toHaveProperty("phone");
    expect(projection).not.toHaveProperty("businesses");
    expect(projection).not.toHaveProperty("profileImageStorageKey");
  });

  it("DIRECTORY not required for candidate list", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-nodir@example.com`, "P15 No Directory");
    const admin = await createEligibleMember(`${TAG}-nodir-admin@example.com`, "P15 NoDir Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");

    await prisma.profile.update({
      where: { id: member.profileId },
      data: { visibilityStatus: "PRIVATE" },
    });

    const candidates = await listSpotlightCandidates(admin.userId, "P15 No Directory");
    expect(candidates.some((c) => c.professional.profileId === member.profileId)).toBe(true);
  });

  it("cross-member interest mutation denied", async (ctx) => {
    requireDisposableDb(ctx);
    const a = await createEligibleMember(`${TAG}-cm-a@example.com`, "P15 CMA");
    const b = await createEligibleMember(`${TAG}-cm-b@example.com`, "P15 CMB");
    await expect(updateOwnSpotlightInterest(a.userId, false, b.userId)).rejects.toBeInstanceOf(
      AppError,
    );
  });

  it("EXCO_VIEWER list of ineligible Spotlight does not persist archive (F-001)", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-f001-m@example.com`, "P15 F001 Member");
    const admin = await createEligibleMember(`${TAG}-f001-a@example.com`, "P15 F001 Admin");
    const viewer = await createEligibleMember(`${TAG}-f001-v@example.com`, "P15 F001 Viewer");
    await grantRole(admin.userId, "EXCO_ADMIN");
    await grantRole(viewer.userId, "EXCO_VIEWER");

    const created = await createSpotlight({
      actorUserId: admin.userId,
      profileId: member.profileId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("expected createSpotlight ok");

    // Make Spotlight ineligible while leaving it non-ARCHIVED — the former write path.
    await prisma.profile.update({
      where: { id: member.profileId },
      data: { spotlightInterest: false },
    });

    const before = await prisma.spotlight.findUniqueOrThrow({ where: { id: created.spotlightId } });
    expect(before.status).not.toBe("ARCHIVED");
    const beforeUpdatedAt = before.updatedAt;

    const listed = await listExistingSpotlights(viewer.userId);
    const hit = listed.find((s) => s.id === created.spotlightId);
    expect(hit).toBeTruthy();
    expect(hit!.currentlyEligible).toBe(false);
    // Projection may still show DRAFT/PUBLISHED; must not have mutated DB.
    expect(hit!.status).toBe(before.status);

    const after = await prisma.spotlight.findUniqueOrThrow({ where: { id: created.spotlightId } });
    expect(after.status).toBe(before.status);
    expect(after.updatedAt.getTime()).toBe(beforeUpdatedAt.getTime());
  });

  it("EXCO_ADMIN list of ineligible Spotlight auto-archives with spotlight.manage", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-f001-adm@example.com`, "P15 F001 AdminPath");
    const admin = await createEligibleMember(`${TAG}-f001-adm-a@example.com`, "P15 F001 AdminActor");
    await grantRole(admin.userId, "EXCO_ADMIN");

    const created = await createSpotlight({
      actorUserId: admin.userId,
      profileId: member.profileId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("expected createSpotlight ok");

    await prisma.profile.update({
      where: { id: member.profileId },
      data: { spotlightInterest: false },
    });

    const listed = await listExistingSpotlights(admin.userId);
    const hit = listed.find((s) => s.id === created.spotlightId);
    expect(hit).toBeTruthy();
    expect(hit!.status).toBe("ARCHIVED");
    expect(hit!.currentlyEligible).toBe(false);

    const after = await prisma.spotlight.findUniqueOrThrow({ where: { id: created.spotlightId } });
    expect(after.status).toBe("ARCHIVED");
  });


  it("SUPER_ADMIN list of ineligible Spotlight auto-archives with spotlight.manage (F-001)", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-f001-sa-m@example.com`, "P15 F001 SuperM");
    const superAdmin = await createEligibleMember(`${TAG}-f001-sa@example.com`, "P15 F001 SuperA");
    await grantRole(superAdmin.userId, "SUPER_ADMIN");

    const created = await createSpotlight({
      actorUserId: superAdmin.userId,
      profileId: member.profileId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) throw new Error("expected createSpotlight ok");

    await prisma.profile.update({
      where: { id: member.profileId },
      data: { spotlightInterest: false },
    });

    const listed = await listExistingSpotlights(superAdmin.userId);
    const hit = listed.find((s) => s.id === created.spotlightId);
    expect(hit).toBeTruthy();
    expect(hit!.status).toBe("ARCHIVED");
    expect(hit!.currentlyEligible).toBe(false);

    const after = await prisma.spotlight.findUniqueOrThrow({ where: { id: created.spotlightId } });
    expect(after.status).toBe("ARCHIVED");
  });

  it("MEMBER and anonymous cannot list Spotlights", async (ctx) => {
    requireDisposableDb(ctx);
    const member = await createEligibleMember(`${TAG}-f001-deny@example.com`, "P15 F001 Deny");
    await expect(listExistingSpotlights(member.userId)).rejects.toBeInstanceOf(AppError);
    await expect(listExistingSpotlights(randomUUID())).rejects.toBeInstanceOf(AppError);
  });
});
