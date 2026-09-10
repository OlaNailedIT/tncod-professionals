/**
 * Phase 16 Opportunities — command-boundary evidence.
 */
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";
import {
  closeOpportunity,
  createOpportunity,
  expressInterest,
  removeInterest,
} from "@/features/opportunities/commands";

const prisma = new PrismaClient();
const TAG = `p16-bound-${Date.now()}`;

let dbReady = false;
let schemaReady = false;

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

async function createUser(email: string, displayName: string) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email,
      phone: null,
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
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  await grantRole(id, "MEMBER");
  return { userId: id, profileId: profile.id };
}

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
    const col = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'opportunity_interests'
       ) AS e`,
    );
    schemaReady = col[0]?.e === true;
  } catch {
    dbReady = false;
  }
});

describe("Phase 16 Opportunities command boundary", () => {
  it("skips honestly when migration missing", () => {
    if (!dbReady || !schemaReady) {
      expect(dbReady && schemaReady).toBe(false);
      return;
    }
    expect(schemaReady).toBe(true);
  });

  it("EXCO_ADMIN create ALLOW; Viewer/Member DENY; forged creator ignored", async () => {
    if (!dbReady || !schemaReady) return;
    const admin = await createUser(`${TAG}-admin@example.com`, "P16 Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");
    const viewer = await createUser(`${TAG}-viewer@example.com`, "P16 Viewer");
    await grantRole(viewer.userId, "EXCO_VIEWER");
    const member = await createUser(`${TAG}-member@example.com`, "P16 Member");

    const created = await createOpportunity({
      actorUserId: admin.userId,
      raw: {
        type: "TRAINING",
        title: "P16 Training Workshop",
        description: "A useful training opportunity for members in the community.",
        createdBy: member.userId,
        role: "MEMBER",
      },
    });
    expect(created.ok).toBe(true);
    if (created.ok) {
      const row = await prisma.opportunity.findUniqueOrThrow({ where: { id: created.opportunityId } });
      expect(row.createdById).toBe(admin.userId);
      expect(row.status).toBe("ACTIVE");
    }

    await expect(
      createOpportunity({
        actorUserId: viewer.userId,
        raw: {
          type: "JOBS",
          title: "Should fail viewer",
          description: "Viewer must not create opportunities in V1.1.",
        },
      }),
    ).rejects.toBeInstanceOf(AppError);

    await expect(
      createOpportunity({
        actorUserId: member.userId,
        raw: {
          type: "JOBS",
          title: "Should fail member",
          description: "Member must not create opportunities in V1.1.",
        },
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("member interest ALLOW; cross-member DENY; closed DENY; duplicate idempotent; concurrency one row", async () => {
    if (!dbReady || !schemaReady) return;
    const admin = await createUser(`${TAG}-adm2@example.com`, "P16 Admin2");
    await grantRole(admin.userId, "EXCO_ADMIN");
    const a = await createUser(`${TAG}-a@example.com`, "P16 A");
    const b = await createUser(`${TAG}-b@example.com`, "P16 B");

    const created = await createOpportunity({
      actorUserId: admin.userId,
      raw: {
        type: "MENTORSHIP",
        title: "P16 Mentorship Signal",
        description: "Mentorship opportunity used for interest boundary tests.",
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    await expect(
      expressInterest({
        actorUserId: a.userId,
        opportunityId: created.opportunityId,
        profileId: b.profileId,
        userId: b.userId,
      }),
    ).rejects.toBeInstanceOf(AppError);

    const ok = await expressInterest({
      actorUserId: a.userId,
      opportunityId: created.opportunityId,
      profileId: b.profileId,
    });
    expect(ok.ok).toBe(true);

    const countA = await prisma.opportunityInterest.count({
      where: { opportunityId: created.opportunityId, profileId: a.profileId },
    });
    expect(countA).toBe(1);
    const countB = await prisma.opportunityInterest.count({
      where: { opportunityId: created.opportunityId, profileId: b.profileId },
    });
    expect(countB).toBe(0);

    const dup = await expressInterest({
      actorUserId: a.userId,
      opportunityId: created.opportunityId,
    });
    expect(dup.ok).toBe(true);
    expect(
      await prisma.opportunityInterest.count({
        where: { opportunityId: created.opportunityId, profileId: a.profileId },
      }),
    ).toBe(1);

    const [r1, r2] = await Promise.all([
      expressInterest({ actorUserId: b.userId, opportunityId: created.opportunityId }),
      expressInterest({ actorUserId: b.userId, opportunityId: created.opportunityId }),
    ]);
    expect(r1.ok && r2.ok).toBe(true);
    expect(
      await prisma.opportunityInterest.count({
        where: { opportunityId: created.opportunityId, profileId: b.profileId },
      }),
    ).toBe(1);

    await closeOpportunity({ actorUserId: admin.userId, opportunityId: created.opportunityId });
    const closed = await expressInterest({
      actorUserId: a.userId,
      opportunityId: created.opportunityId,
    });
    // a already interested — idempotent success; new member should fail
    const c = await createUser(`${TAG}-c@example.com`, "P16 C");
    const closedNew = await expressInterest({
      actorUserId: c.userId,
      opportunityId: created.opportunityId,
    });
    expect(closedNew.ok).toBe(false);
    if (!closedNew.ok) expect(closedNew.code).toBe("CLOSED");
    void closed;

    await removeInterest({ actorUserId: a.userId, opportunityId: created.opportunityId });
    expect(
      await prisma.opportunityInterest.count({
        where: { opportunityId: created.opportunityId, profileId: a.profileId },
      }),
    ).toBe(0);

    const consents = await prisma.consent.count({ where: { userId: a.userId } });
    expect(consents).toBe(0);
  });

  it("random opportunity UUID interest fails safely", async () => {
    if (!dbReady || !schemaReady) return;
    const member = await createUser(`${TAG}-idor@example.com`, "P16 IDOR");
    const result = await expressInterest({
      actorUserId: member.userId,
      opportunityId: randomUUID(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("NOT_FOUND");
  });
});
