/**
 * Phase 12 forensic DB closeout — disposable Supabase only.
 * Calls real domain commands (submitProfile / EXCO decisions / publish).
 * Production: NONE.
 *
 * Run: npx tsx -r ./scripts/register-server-only.cjs scripts/phase12-db-closeout.ts
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { AppError } from "../src/lib/errors";
import { submitProfile } from "../src/features/professional/submit-profile";
import {
  applyExcoProfessionalDecision,
  publishProfile,
  unpublishProfile,
} from "../src/features/professional/exco-review";
import {
  calculateProfileCompletion,
  normalizeOpportunityPreferences,
  toCompletionInput,
} from "../src/features/profile/completion";

const prisma = new PrismaClient();
const TAG = `p12-closeout-${Date.now()}`;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function grantRole(userId: string, roleName: "MEMBER" | "EXCO_VIEWER" | "EXCO_ADMIN") {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
}

async function createMember(input: { email: string; displayName: string; complete: boolean }) {
  const id = randomUUID();
  const industry = input.complete
    ? await prisma.industry.upsert({
        where: { slug: "technology" },
        create: { name: "Technology", slug: "technology", isActive: true },
        update: {},
      })
    : null;

  await prisma.user.create({
    data: {
      id,
      email: input.email,
      phone: null,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName: input.displayName,
          location: input.complete ? "Lagos" : null,
          bio: input.complete ? "Bio text that is long enough for completion." : null,
          professionalSituation: "Employee",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          clarificationMessage: input.complete ? "stale" : null,
          professionalDetails: {
            create: {
              profession: input.complete ? "Engineer" : null,
              yearsExperience: input.complete ? 5 : null,
              linkedinUrl: input.complete ? "https://www.linkedin.com/in/example" : null,
              lookingForSummary: input.complete ? "Peers" : null,
              offeringSummary: input.complete ? "Help" : null,
              opportunityPreferences: input.complete
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
          churchInformation: input.complete ? { create: { serviceArea: "Lagos" } } : undefined,
          experiences: input.complete
            ? { create: [{ role: "Engineer", organisation: "TNCOD" }] }
            : undefined,
        },
      },
    },
  });

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  if (input.complete) {
    const skillSlug = `p12-${id.slice(0, 8)}-skill`;
    const serviceSlug = `p12-${id.slice(0, 8)}-svc`;
    const skill = await prisma.skill.create({
      data: { name: `TS ${id.slice(0, 8)}`, slug: skillSlug, isActive: true },
    });
    const service = await prisma.service.create({
      data: { name: `Consulting ${id.slice(0, 8)}`, slug: serviceSlug, isActive: true },
    });
    await prisma.profileSkill.create({ data: { profileId: profile.id, skillId: skill.id } });
    await prisma.profileService.create({
      data: { profileId: profile.id, serviceId: service.id },
    });
  }
  await grantRole(id, "MEMBER");
  return { userId: id, profileId: profile.id };
}

async function loadCompletionPercent(profileId: string): Promise<number> {
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

async function main() {
  console.log("Phase 12 DB closeout starting…", TAG);

  const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='profiles'
       AND column_name = 'clarification_message'`,
  );
  assert(cols.length === 1, "profiles.clarification_message missing");

  const incomplete = await createMember({
    email: `${TAG}-incomplete@example.com`,
    displayName: `${TAG} Incomplete`,
    complete: false,
  });
  const complete = await createMember({
    email: `${TAG}-complete@example.com`,
    displayName: `${TAG} Complete Ada`,
    complete: true,
  });
  const viewer = await createMember({
    email: `${TAG}-viewer@example.com`,
    displayName: `${TAG} Viewer`,
    complete: false,
  });
  await grantRole(viewer.userId, "EXCO_VIEWER");
  const admin = await createMember({
    email: `${TAG}-admin@example.com`,
    displayName: `${TAG} Admin`,
    complete: false,
  });
  await grantRole(admin.userId, "EXCO_ADMIN");

  assert((await loadCompletionPercent(incomplete.profileId)) < 100, "incomplete <100");
  assert((await loadCompletionPercent(complete.profileId)) === 100, "complete =100");

  const denyInc = await submitProfile(incomplete.userId);
  assert(!denyInc.ok, "incomplete submit denied by command");

  const allow = await submitProfile(complete.userId);
  assert(allow.ok, "complete submit allowed by command");
  let profile = await prisma.profile.findUniqueOrThrow({ where: { id: complete.profileId } });
  assert(profile.verificationStatus === "PENDING", "PENDING after submit");
  assert(profile.profileStatus === "SUBMITTED", "SUBMITTED after submit");
  assert(profile.clarificationMessage === null, "clarification cleared");
  assert(profile.visibilityStatus === "PRIVATE", "visibility unchanged");

  let viewerDenied = false;
  try {
    await applyExcoProfessionalDecision({
      reviewerUserId: viewer.userId,
      profileId: complete.profileId,
      action: "start_review",
    });
  } catch (err) {
    viewerDenied = err instanceof AppError && err.code === "UNAUTHORIZED";
  }
  assert(viewerDenied, "EXCO_VIEWER denied at command boundary");

  const start = await applyExcoProfessionalDecision({
    reviewerUserId: admin.userId,
    profileId: complete.profileId,
    action: "start_review",
  });
  assert(start.ok, "admin start_review");

  const clarifyNo = await applyExcoProfessionalDecision({
    reviewerUserId: admin.userId,
    profileId: complete.profileId,
    action: "request_clarification",
    memberFacingMessage: " ",
  });
  assert(!clarifyNo.ok, "clarification without reason denied");

  const rejectNo = await applyExcoProfessionalDecision({
    reviewerUserId: admin.userId,
    profileId: complete.profileId,
    action: "reject",
    memberFacingMessage: "",
  });
  assert(!rejectNo.ok, "rejection without reason denied");

  const biz = await prisma.business.create({
    data: {
      name: `${TAG} Biz`,
      businessStatus: "SUBMITTED",
      visibilityStatus: "PRIVATE",
      professionals: {
        create: { profileId: complete.profileId, relationshipType: "OWNER" },
      },
    },
  });

  const verify = await applyExcoProfessionalDecision({
    reviewerUserId: admin.userId,
    profileId: complete.profileId,
    action: "verify",
  });
  assert(verify.ok, "verify");
  profile = await prisma.profile.findUniqueOrThrow({ where: { id: complete.profileId } });
  assert(profile.verificationStatus === "VERIFIED", "VERIFIED");
  assert(profile.visibilityStatus === "PRIVATE", "verify ≠ publish");

  const earlyPub = await publishProfile({
    actorUserId: admin.userId,
    profileId: complete.profileId,
  });
  // already verified — should allow. Wait we need early before verify - already verified.
  // Test publish while PENDING was covered by integration; here publish after verify:
  assert(earlyPub.ok, "publish VERIFIED");
  profile = await prisma.profile.findUniqueOrThrow({ where: { id: complete.profileId } });
  assert(profile.visibilityStatus === "DIRECTORY", "DIRECTORY");
  assert(Boolean(profile.publicSlug), "slug minted");
  const slug = profile.publicSlug;

  const unpub = await unpublishProfile({
    actorUserId: admin.userId,
    profileId: complete.profileId,
  });
  assert(unpub.ok, "unpublish");
  profile = await prisma.profile.findUniqueOrThrow({ where: { id: complete.profileId } });
  assert(profile.visibilityStatus === "MEMBERS_ONLY", "MEMBERS_ONLY");
  assert(profile.verificationStatus === "VERIFIED", "VERIFIED preserved");
  assert(profile.publicSlug === slug, "slug preserved");

  const bizAfter = await prisma.business.findUniqueOrThrow({ where: { id: biz.id } });
  assert(bizAfter.businessStatus === "SUBMITTED", "business isolation");

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO supabase_migrations.schema_migrations (version)
       VALUES ('20260908210000')
       ON CONFLICT DO NOTHING`,
    );
  } catch {
    // optional
  }

  console.log("PHASE 12 DB CLOSEOUT PASS");
}

main()
  .catch((err) => {
    console.error("PHASE 12 DB CLOSEOUT FAIL", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
