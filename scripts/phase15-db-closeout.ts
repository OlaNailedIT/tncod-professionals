/**
 * Phase 15 DB closeout — disposable Supabase.
 * Run: npx tsx -r ./scripts/register-server-only.cjs scripts/phase15-db-closeout.ts
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createSpotlight } from "../src/features/spotlight/commands";
import { updateOwnSpotlightInterest } from "../src/features/spotlight/own-interest";

const prisma = new PrismaClient();
const TAG = `p15-closeout-${Date.now()}`;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

async function grantRole(userId: string, roleName: "MEMBER" | "EXCO_ADMIN" | "EXCO_VIEWER") {
  const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    create: { userId, roleId: role.id },
    update: {},
  });
}

async function createEligible(email: string, displayName: string) {
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
          location: "Cape Town",
          bio: "Closeout bio for Phase 15 eligibility.",
          professionalSituation: "Employee",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "MEMBERS_ONLY",
          profileStatus: "COMPLETE",
          spotlightInterest: false,
          professionalDetails: {
            create: {
              profession: "Designer",
              yearsExperience: 4,
              linkedinUrl: "https://www.linkedin.com/in/closeout",
              lookingForSummary: "Peers",
              offeringSummary: "Design help",
              opportunityPreferences: {
                collaboration: true,
                mentorship: true,
                referrals: true,
                training: true,
              },
              industryId: industry.id,
            },
          },
          churchInformation: { create: { serviceArea: "Cape Town" } },
          experiences: { create: [{ role: "Designer", organisation: "TNCOD" }] },
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  const skill = await prisma.skill.create({
    data: { name: `P15 ${id.slice(0, 6)}`, slug: `p15c-${id.slice(0, 8)}`, isActive: true },
  });
  const service = await prisma.service.create({
    data: {
      name: `P15 Svc ${id.slice(0, 6)}`,
      slug: `p15c-svc-${id.slice(0, 8)}`,
      isActive: true,
    },
  });
  await prisma.profileSkill.create({ data: { profileId: profile.id, skillId: skill.id } });
  await prisma.profileService.create({
    data: { profileId: profile.id, serviceId: service.id },
  });
  await grantRole(id, "MEMBER");
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles
       SET verification_status = 'VERIFIED'::"VerificationStatus",
           spotlight_interest = true,
           profile_image_storage_key = $1
       WHERE id = $2::uuid`,
      `test-headshots/${id}.jpg`,
      profile.id,
    );
  });
  return { userId: id, profileId: profile.id };
}

async function main() {
  console.log("Phase 15 DB closeout…", TAG);

  const col = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'profiles'
         AND column_name = 'spotlight_interest'
     ) AS e`,
  );
  assert(col[0]?.e === true, "spotlight_interest column missing");

  const idx = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_indexes
       WHERE schemaname = 'public'
         AND indexname = 'spotlights_one_active_per_profile_uq'
     ) AS e`,
  );
  assert(idx[0]?.e === true, "active spotlight unique index missing");

  const member = await createEligible(`${TAG}-m@example.com`, "P15 Closeout Member");
  const admin = await createEligible(`${TAG}-a@example.com`, "P15 Closeout Admin");
  await grantRole(admin.userId, "EXCO_ADMIN");
  const viewer = await createEligible(`${TAG}-v@example.com`, "P15 Closeout Viewer");
  await grantRole(viewer.userId, "EXCO_VIEWER");

  let viewerDenied = false;
  try {
    await createSpotlight({ actorUserId: viewer.userId, profileId: member.profileId });
  } catch {
    viewerDenied = true;
  }
  assert(viewerDenied, "viewer must be denied create");

  const created = await createSpotlight({
    actorUserId: admin.userId,
    profileId: member.profileId,
  });
  assert(created.ok, "admin create must succeed");

  const dup = await createSpotlight({
    actorUserId: admin.userId,
    profileId: member.profileId,
  });
  assert(!dup.ok, "duplicate active must fail");

  await updateOwnSpotlightInterest(member.userId, false);
  const active = await prisma.spotlight.count({
    where: { profileId: member.profileId, status: { not: "ARCHIVED" } },
  });
  assert(active === 0, "interest withdraw must archive");

  const consents = await prisma.consent.count({ where: { userId: member.userId } });
  assert(consents === 0, "no fabricated consent");

  // RLS: member JWT cannot SELECT spotlights (policy EXCO-only)
  // Privileged Prisma bypasses RLS — verify policy text exists.
  const pol = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename = 'spotlights'
         AND policyname = 'spotlights_select_exco'
     ) AS e`,
  );
  assert(pol[0]?.e === true, "spotlights_select_exco policy missing");

  console.log("PHASE 15 DB CLOSEOUT PASS");
}

main()
  .catch((e) => {
    console.error("PHASE 15 DB CLOSEOUT FAIL", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
