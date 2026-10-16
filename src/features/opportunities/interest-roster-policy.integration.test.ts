/**
 * Direct row-level checks for opportunity_interests.
 * Uses SET ROLE anon/authenticated and synthetic JWT subject claims.
 * Privileged Prisma is only the fixture writer, after the disposable gate.
 *
 * Default: skipped unless PHASE4_DISPOSABLE_AUTH_TESTS=1.
 * Opted-in run: fails when the loopback database or schema is unavailable.
 */
import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  assertDisposableDatabaseEnv,
  DISPOSABLE_AUTH_OPT_IN,
} from "@/features/registration/disposable-env-gate";

const requested = process.env[DISPOSABLE_AUTH_OPT_IN] === "1";
const TAG = `roster-rls-${Date.now()}`;

let prisma: PrismaClient;

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
      phone: `+234${randomUUID().replace(/-/g, "").slice(0, 10)}`,
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

async function asDatabaseRole<T>(
  role: "anon" | "authenticated",
  claims: { sub?: string; roleClaim?: string },
  run: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    const sub = claims.sub ?? "";
    const roleClaim = claims.roleClaim ?? (role === "anon" ? "anon" : "authenticated");
    await tx.$executeRaw`SELECT set_config('request.jwt.claim.sub', ${sub}, true)`;
    await tx.$executeRaw`SELECT set_config('request.jwt.claim.role', ${roleClaim}, true)`;
    await tx.$executeRaw`SELECT set_config('request.jwt.claims', ${JSON.stringify({
      sub,
      role: roleClaim,
    })}, true)`;
    await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role}`);
    try {
      return await run(tx);
    } finally {
      await tx.$executeRawUnsafe("RESET ROLE");
    }
  });
}

async function visibleInterestIds(
  role: "anon" | "authenticated",
  claims: { sub?: string; roleClaim?: string },
  interestIds: string[],
): Promise<string[] | "DENIED"> {
  try {
    return await asDatabaseRole(role, claims, async (tx) => {
      const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id::text AS id
         FROM public.opportunity_interests
         WHERE id = ANY($1::uuid[])`,
        interestIds,
      );
      return rows.map((row) => row.id);
    });
  } catch {
    return "DENIED";
  }
}

describe.skipIf(!requested)("opportunity interest roster policies", () => {
  it("enforces interest reads and own-row express/withdraw under database roles", async () => {
    const gate = assertDisposableDatabaseEnv();
    if (!gate.ok) throw new Error(gate.reason);
    prisma = new PrismaClient();
    try {
    await prisma.$queryRaw`SELECT 1`;
    const col = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'opportunity_interests'
       ) AS e`,
    );
    if (col[0]?.e !== true) {
      throw new Error("opportunity_interests is not present on the disposable database");
    }
    const admin = await createUser(`${TAG}-admin@example.com`, "Policy Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");
    const viewer = await createUser(`${TAG}-viewer@example.com`, "Policy Viewer");
    await grantRole(viewer.userId, "EXCO_VIEWER");
    const superAdmin = await createUser(`${TAG}-super@example.com`, "Policy Super");
    await grantRole(superAdmin.userId, "SUPER_ADMIN");
    const memberA = await createUser(`${TAG}-a@example.com`, "Policy A");
    const memberB = await createUser(`${TAG}-b@example.com`, "Policy B");
    const memberC = await createUser(`${TAG}-c@example.com`, "Policy C");

    const opportunity = await prisma.opportunity.create({
      data: {
        type: "OTHER",
        title: "Policy roster opportunity",
        description: "Disposable row for interest policy checks.",
        status: "ACTIVE",
        createdById: admin.userId,
        publishedAt: new Date(),
      },
    });
    const interestA = await prisma.opportunityInterest.create({
      data: { opportunityId: opportunity.id, profileId: memberA.profileId },
    });
    const interestB = await prisma.opportunityInterest.create({
      data: { opportunityId: opportunity.id, profileId: memberB.profileId },
    });
    const ids = [interestA.id, interestB.id];

    const anon = await visibleInterestIds("anon", {}, ids);
    expect(anon === "DENIED" || anon.length === 0).toBe(true);

    const own = await visibleInterestIds("authenticated", { sub: memberA.userId }, ids);
    expect(own).toEqual([interestA.id]);

    const cross = await visibleInterestIds("authenticated", { sub: memberB.userId }, [interestA.id]);
    expect(cross === "DENIED" || (Array.isArray(cross) && cross.length === 0)).toBe(true);

    const forgedAdminClaim = await visibleInterestIds(
      "authenticated",
      { sub: memberA.userId, roleClaim: "EXCO_ADMIN" },
      [interestB.id],
    );
    expect(
      forgedAdminClaim === "DENIED" ||
        (Array.isArray(forgedAdminClaim) && forgedAdminClaim.length === 0),
    ).toBe(true);

    const asViewer = await visibleInterestIds("authenticated", { sub: viewer.userId }, ids);
    expect(asViewer === "DENIED" || (Array.isArray(asViewer) && asViewer.length === 0)).toBe(true);

    const asAdmin = await visibleInterestIds("authenticated", { sub: admin.userId }, ids);
    expect(asAdmin).toEqual(expect.arrayContaining(ids));
    expect(Array.isArray(asAdmin) && asAdmin).toHaveLength(2);

    const asSuper = await visibleInterestIds("authenticated", { sub: superAdmin.userId }, ids);
    expect(asSuper).toEqual(expect.arrayContaining(ids));

    await asDatabaseRole("authenticated", { sub: memberA.userId }, async (tx) => {
      const removed = await tx.$executeRawUnsafe(
        `DELETE FROM public.opportunity_interests WHERE id = $1::uuid`,
        interestA.id,
      );
      expect(removed).toBe(1);
    });
    expect(
      await prisma.opportunityInterest.count({ where: { id: interestA.id } }),
    ).toBe(0);

    const reexpressed = await asDatabaseRole("authenticated", { sub: memberA.userId }, async (tx) => {
      const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
        `INSERT INTO public.opportunity_interests (opportunity_id, profile_id)
         VALUES ($1::uuid, $2::uuid)
         RETURNING id::text AS id`,
        opportunity.id,
        memberA.profileId,
      );
      return rows[0]?.id;
    });
    expect(reexpressed).toBeTruthy();

    await expect(
      asDatabaseRole("authenticated", { sub: memberA.userId }, async (tx) => {
        await tx.$executeRawUnsafe(
          `INSERT INTO public.opportunity_interests (opportunity_id, profile_id)
           VALUES ($1::uuid, $2::uuid)`,
          opportunity.id,
          memberC.profileId,
        );
      }),
    ).rejects.toThrow();

    expect(
      await prisma.opportunityInterest.count({
        where: { opportunityId: opportunity.id, profileId: memberC.profileId },
      }),
    ).toBe(0);
    } finally {
      await prisma?.$disconnect();
    }
  });
});
