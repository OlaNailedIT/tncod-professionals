/**
 * Phase 17 DB closeout — disposable Supabase.
 * Run: npx tsx -r ./scripts/register-server-only.cjs scripts/phase17-db-closeout.ts
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { createOpportunity, closeOpportunity } from "../src/features/opportunities/commands";
import { findPotentialMatches } from "../src/features/matching/commands";
import { AppError } from "../src/lib/errors";

const prisma = new PrismaClient();
const TAG = `p17-closeout-${Date.now()}`;

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

async function createUser(email: string, displayName: string) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName,
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
        },
      },
    },
  });
  await grantRole(id, "MEMBER");
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  return { userId: id, profileId: profile.id };
}

async function forceVerified(profileId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles SET verification_status = 'VERIFIED'::"VerificationStatus" WHERE id = $1::uuid`,
      profileId,
    );
  });
}

async function main() {
  console.log("Phase 17 DB closeout…", TAG);

  const col = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'opportunities'
         AND column_name = 'required_profession'
     ) AS e`,
  );
  assert(col[0]?.e === true, "required_profession missing");

  const skillsTable = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'opportunity_skills'
     ) AS e`,
  );
  assert(skillsTable[0]?.e === true, "opportunity_skills missing");

  const chk = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'opportunities_min_years_experience_chk'
     ) AS e`,
  );
  assert(chk[0]?.e === true, "min_years_experience check missing");

  const rls = await prisma.$queryRawUnsafe<Array<{ rls: boolean }>>(
    `SELECT relrowsecurity AS rls FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relname = 'opportunity_skills'`,
  );
  assert(rls[0]?.rls === true, "opportunity_skills RLS must be on");

  const admin = await createUser(`${TAG}-a@example.com`, "P17 Closeout Admin");
  await grantRole(admin.userId, "EXCO_ADMIN");
  const member = await createUser(`${TAG}-m@example.com`, "P17 Closeout Member");
  const skillName = `P17CloseSkill-${TAG}`;

  const pro = await createUser(`${TAG}-p@example.com`, "P17 Closeout Pro");
  await prisma.profile.update({
    where: { id: pro.profileId },
    data: { location: "Cape Town" },
  });
  await prisma.professionalDetails.create({
    data: {
      profileId: pro.profileId,
      profession: "Engineer",
      yearsExperience: 6,
    },
  });
  const skill = await prisma.skill.upsert({
    where: { name: skillName },
    create: {
      name: skillName,
      slug: `p17c-${randomUUID().slice(0, 8)}`,
      isActive: true,
    },
    update: {},
  });
  await prisma.profileSkill.create({
    data: { profileId: pro.profileId, skillId: skill.id },
  });
  await prisma.experience.create({
    data: {
      profileId: pro.profileId,
      role: "Engineer",
      organisation: "TNCOD",
      employmentType: "FULL_TIME",
    },
  });
  await forceVerified(pro.profileId);

  const created = await createOpportunity({
    actorUserId: admin.userId,
    raw: {
      type: "JOBS",
      title: "P17 Closeout Opportunity",
      description: "Closeout opportunity description for Phase 17 matching verification.",
      locationPreference: "Cape Town",
      requiredProfession: "Engineer",
      minYearsExperience: 3,
      employmentType: "FULL_TIME",
      requiredSkills: skillName,
    },
  });
  assert(created.ok, "admin create with matching criteria");

  if (created.ok) {
    const skillLinks = await prisma.opportunitySkill.count({
      where: { opportunityId: created.opportunityId },
    });
    assert(skillLinks === 1, "opportunity_skills linked");

    const matches = await findPotentialMatches({
      actorUserId: admin.userId,
      opportunityId: created.opportunityId,
    });
    assert(matches.ok === true, "admin can view matches");
    if (matches.ok) {
      assert(
        matches.matches.some((m) => m.profileId === pro.profileId),
        "verified professional should match",
      );
    }

    let memberDenied = false;
    try {
      await findPotentialMatches({
        actorUserId: member.userId,
        opportunityId: created.opportunityId,
      });
    } catch (e) {
      memberDenied = e instanceof AppError;
    }
    assert(memberDenied, "member must be denied match access");

    await closeOpportunity({
      actorUserId: admin.userId,
      opportunityId: created.opportunityId,
    });
    const closed = await findPotentialMatches({
      actorUserId: admin.userId,
      opportunityId: created.opportunityId,
    });
    assert(closed.ok === false, "closed opportunity not actively matched");
  }

  const consents = await prisma.consent.count({ where: { userId: member.userId } });
  assert(consents === 0, "no consent fabrication");

  // No persisted match table
  const matchTable = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name IN ('matches', 'opportunity_matches', 'potential_matches')
     ) AS e`,
  );
  assert(matchTable[0]?.e === false, "must not create persisted match tables");

  console.log("Phase 17 DB closeout PASS");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
