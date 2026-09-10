/**
 * Phase 16 DB closeout — disposable Supabase.
 * Run: npx tsx -r ./scripts/register-server-only.cjs scripts/phase16-db-closeout.ts
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  createOpportunity,
  expressInterest,
} from "../src/features/opportunities/commands";

const prisma = new PrismaClient();
const TAG = `p16-closeout-${Date.now()}`;

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
  return { userId: id };
}

async function main() {
  console.log("Phase 16 DB closeout…", TAG);

  const table = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = 'opportunity_interests'
     ) AS e`,
  );
  assert(table[0]?.e === true, "opportunity_interests missing");

  const uq = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM pg_constraint
       WHERE conname = 'opportunity_interests_one_per_member_uq'
     ) AS e`,
  );
  assert(uq[0]?.e === true, "unique interest constraint missing");

  const memberManage = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT COUNT(*)::bigint AS c
     FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.name = 'MEMBER' AND p.key = 'opportunity.manage'`,
  );
  assert(Number(memberManage[0]?.c ?? 1) === 0, "MEMBER must not retain opportunity.manage");

  const admin = await createUser(`${TAG}-a@example.com`, "P16 Closeout Admin");
  await grantRole(admin.userId, "EXCO_ADMIN");
  const member = await createUser(`${TAG}-m@example.com`, "P16 Closeout Member");

  const created = await createOpportunity({
    actorUserId: admin.userId,
    raw: {
      type: "OTHER",
      title: "P16 Closeout Opportunity",
      description: "Closeout opportunity description for Phase 16 verification.",
    },
  });
  assert(created.ok, "admin create");

  if (created.ok) {
    const interest = await expressInterest({
      actorUserId: member.userId,
      opportunityId: created.opportunityId,
    });
    assert(interest.ok, "member interest");
  }

  const consents = await prisma.consent.count({ where: { userId: member.userId } });
  assert(consents === 0, "no consent fabrication");

  console.log("PHASE 16 DB CLOSEOUT PASS");
}

main()
  .catch((e) => {
    console.error("PHASE 16 DB CLOSEOUT FAIL", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
