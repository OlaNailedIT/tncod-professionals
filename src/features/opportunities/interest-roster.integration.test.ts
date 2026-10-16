/**
 * Current interest roster — disposable database only.
 * CI excludes this file. Do not point DATABASE_URL at Production.
 */
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";
import {
  createOpportunity,
  expressInterest,
  removeInterest,
} from "@/features/opportunities/commands";
import {
  canViewInterestRoster,
  listCurrentOpportunityInterest,
} from "@/features/opportunities/interest-roster";

const prisma = new PrismaClient();
const TAG = `roster-${Date.now()}`;
const SECRET_EMAIL_DOMAIN = "roster-secret.example";

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
      phone: `+234${randomUUID().replace(/-/g, "").slice(0, 10)}`,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName,
          headline: "private headline",
          bio: "private bio",
          location: "Lagos",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  await grantRole(id, "MEMBER");
  return { userId: id, profileId: profile.id, email, displayName };
}

async function openOpportunity(actorUserId: string, title: string) {
  const created = await createOpportunity({
    actorUserId,
    raw: {
      type: "COLLABORATION",
      title,
      description: "Disposable opportunity used only for the interest roster boundary.",
    },
  });
  expect(created.ok).toBe(true);
  if (!created.ok) throw new Error("opportunity was not created");
  return created.opportunityId;
}

beforeAll(async () => {
  const url = process.env.DATABASE_URL ?? "";
  if (/supabase\.co|pooler\.supabase|brpppukzqgpzxjelwwrj/i.test(url)) {
    throw new Error("Refusing interest roster tests against a hosted database");
  }
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

describe("opportunity interest roster", () => {
  it("skips honestly when the disposable database is unavailable", () => {
    if (!dbReady || !schemaReady) {
      expect(dbReady && schemaReady).toBe(false);
      return;
    }
    expect(schemaReady).toBe(true);
  });

  it("limits the roster to EXCO_ADMIN and SUPER_ADMIN and strips contact fields", async () => {
    if (!dbReady || !schemaReady) return;

    const admin = await createUser(`${TAG}-admin@${SECRET_EMAIL_DOMAIN}`, "Roster Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");
    const superAdmin = await createUser(`${TAG}-super@${SECRET_EMAIL_DOMAIN}`, "Roster Super");
    await grantRole(superAdmin.userId, "SUPER_ADMIN");
    const viewer = await createUser(`${TAG}-viewer@${SECRET_EMAIL_DOMAIN}`, "Roster Viewer");
    await grantRole(viewer.userId, "EXCO_VIEWER");
    const member = await createUser(`${TAG}-member@${SECRET_EMAIL_DOMAIN}`, "Roster Member");
    const other = await createUser(`${TAG}-other@${SECRET_EMAIL_DOMAIN}`, "Other Opportunity");

    expect(await canViewInterestRoster(admin.userId)).toBe(true);
    expect(await canViewInterestRoster(superAdmin.userId)).toBe(true);
    expect(await canViewInterestRoster(viewer.userId)).toBe(false);
    expect(await canViewInterestRoster(member.userId)).toBe(false);
    expect(await canViewInterestRoster(randomUUID())).toBe(false);
    expect(await canViewInterestRoster("")).toBe(false);

    await expect(
      createOpportunity({
        actorUserId: member.userId,
        raw: {
          type: "JOBS",
          title: "Member must not create",
          description: "Creation stays behind opportunity.manage.",
        },
      }),
    ).rejects.toBeInstanceOf(AppError);
    await expect(
      createOpportunity({
        actorUserId: viewer.userId,
        raw: {
          type: "JOBS",
          title: "Viewer must not create",
          description: "Creation stays behind opportunity.manage.",
        },
      }),
    ).rejects.toBeInstanceOf(AppError);

    const opportunityId = await openOpportunity(admin.userId, "Roster Target Opportunity");
    const otherOpportunityId = await openOpportunity(admin.userId, "Roster Other Opportunity");

    await expect(
      expressInterest({
        actorUserId: member.userId,
        opportunityId,
        userId: admin.userId,
      }),
    ).rejects.toThrow(/Client-supplied identity is not authoritative/);
    expect(
      (
        await expressInterest({
          actorUserId: member.userId,
          opportunityId,
          profileId: admin.profileId,
        })
      ).ok,
    ).toBe(true);
    expect((await expressInterest({ actorUserId: other.userId, opportunityId: otherOpportunityId })).ok).toBe(
      true,
    );

    const listed = await listCurrentOpportunityInterest({
      actorUserId: admin.userId,
      opportunityId,
      role: "SUPER_ADMIN",
      profileId: member.profileId,
    });
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.opportunityId).toBe(opportunityId);
    expect(listed.opportunityStatus).toBe("ACTIVE");
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]?.displayName).toBe("Roster Member");
    expect(listed.items[0]?.professionalHref).toBe(`/exco/professionals/${member.profileId}`);
    expect(listed.items[0]?.expressedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    const payload = JSON.stringify(listed);
    expect(payload).not.toContain(member.email);
    expect(payload).not.toContain("+234");
    expect(payload).not.toContain(member.userId);
    expect(payload).not.toContain("private headline");
    expect(payload).not.toContain("private bio");
    expect(payload).not.toContain("Lagos");
    expect(payload).not.toContain("Other Opportunity");
    expect(payload).not.toContain(other.profileId);

    const asSuper = await listCurrentOpportunityInterest({
      actorUserId: superAdmin.userId,
      opportunityId,
    });
    expect(asSuper.ok).toBe(true);
    if (asSuper.ok) expect(asSuper.items.map((row) => row.displayName)).toEqual(["Roster Member"]);

    await expect(
      listCurrentOpportunityInterest({ actorUserId: viewer.userId, opportunityId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      listCurrentOpportunityInterest({ actorUserId: member.userId, opportunityId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      listCurrentOpportunityInterest({ actorUserId: randomUUID(), opportunityId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      listCurrentOpportunityInterest({
        actorUserId: admin.userId,
        opportunityId,
        userId: member.userId,
      }),
    ).rejects.toThrow(/Client-supplied identity is not authoritative/);

    const missing = await listCurrentOpportunityInterest({
      actorUserId: admin.userId,
      opportunityId: randomUUID(),
    });
    expect(missing).toEqual({ ok: false, code: "NOT_FOUND", message: "Opportunity not found" });

    await removeInterest({ actorUserId: member.userId, opportunityId });
    const withdrawn = await listCurrentOpportunityInterest({
      actorUserId: superAdmin.userId,
      opportunityId,
    });
    expect(withdrawn.ok).toBe(true);
    if (withdrawn.ok) expect(withdrawn.items).toEqual([]);

    expect((await expressInterest({ actorUserId: member.userId, opportunityId })).ok).toBe(true);
    await prisma.profile.update({
      where: { id: member.profileId },
      data: { deletedAt: new Date() },
    });
    const deletedProfile = await listCurrentOpportunityInterest({
      actorUserId: admin.userId,
      opportunityId,
    });
    expect(deletedProfile.ok).toBe(true);
    if (deletedProfile.ok) expect(deletedProfile.items).toEqual([]);

    await prisma.profile.update({
      where: { id: other.profileId },
      data: { deletedAt: null },
    });
    await prisma.user.update({
      where: { id: other.userId },
      data: { accountStatus: "SUSPENDED" },
    });
    const suspended = await listCurrentOpportunityInterest({
      actorUserId: admin.userId,
      opportunityId: otherOpportunityId,
    });
    expect(suspended.ok).toBe(true);
    if (suspended.ok) expect(suspended.items).toEqual([]);

    await prisma.user.update({
      where: { id: other.userId },
      data: { accountStatus: "ACTIVE" },
    });
    await prisma.opportunity.update({
      where: { id: otherOpportunityId },
      data: { status: "CLOSED" },
    });
    const closed = await listCurrentOpportunityInterest({
      actorUserId: admin.userId,
      opportunityId: otherOpportunityId,
    });
    expect(closed.ok).toBe(true);
    if (!closed.ok) return;
    expect(closed.opportunityStatus).toBe("CLOSED");
    expect(closed.items.map((row) => row.displayName)).toEqual(["Other Opportunity"]);
    expect(closed.items[0]?.professionalHref).toBe(`/exco/professionals/${other.profileId}`);
  });
});
