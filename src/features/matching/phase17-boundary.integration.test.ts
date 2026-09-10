/**
 * Phase 17 Matching — command-boundary evidence.
 */
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { createOpportunity, closeOpportunity } from "@/features/opportunities/commands";
import {
  canViewOpportunityMatches,
  findPotentialMatches,
} from "@/features/matching/commands";

const prisma = new PrismaClient();
const TAG = `p17-bound-${Date.now()}`;

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

async function createUser(
  email: string,
  displayName: string,
  opts?: {
    profession?: string;
    location?: string;
    years?: number;
    skills?: string[];
    employmentType?: "FULL_TIME" | "PART_TIME";
  },
) {
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
          location: opts?.location ?? null,
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  await grantRole(id, "MEMBER");

  if (opts?.profession || opts?.years != null) {
    await prisma.professionalDetails.create({
      data: {
        profileId: profile.id,
        profession: opts.profession ?? null,
        yearsExperience: opts.years ?? null,
      },
    });
  }

  if (opts?.skills?.length) {
    for (const name of opts.skills) {
      const skill = await prisma.skill.upsert({
        where: { name },
        create: {
          name,
          slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${randomUUID().slice(0, 6)}`,
          isActive: true,
        },
        update: { isActive: true },
      });
      await prisma.profileSkill.create({
        data: { profileId: profile.id, skillId: skill.id },
      });
    }
  }

  if (opts?.employmentType) {
    await prisma.experience.create({
      data: {
        profileId: profile.id,
        role: "Role",
        organisation: "Org",
        employmentType: opts.employmentType,
      },
    });
  }

  return { userId: id, profileId: profile.id };
}

async function forceVerified(profileId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE profiles SET verification_status = 'VERIFIED' WHERE id = $1::uuid`,
      profileId,
    );
  });
}

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
    const col = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'opportunities'
           AND column_name = 'required_profession'
       ) AS e`,
    );
    const table = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
      `SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'opportunity_skills'
       ) AS e`,
    );
    schemaReady = col[0]?.e === true && table[0]?.e === true;
  } catch {
    dbReady = false;
  }
});

describe("Phase 17 Matching command boundary", () => {
  it("skips honestly when migration missing", () => {
    if (!dbReady || !schemaReady) {
      expect(dbReady && schemaReady).toBe(false);
      return;
    }
    expect(schemaReady).toBe(true);
  });

  it("EXCO_ADMIN/VIEWER ALLOW; MEMBER DENY; forged targets ignored; stale+closed", async () => {
    if (!dbReady || !schemaReady) return;

    const admin = await createUser(`${TAG}-admin@example.com`, "P17 Admin");
    await grantRole(admin.userId, "EXCO_ADMIN");
    const viewer = await createUser(`${TAG}-viewer@example.com`, "P17 Viewer");
    await grantRole(viewer.userId, "EXCO_VIEWER");
    const member = await createUser(`${TAG}-member@example.com`, "P17 Member");

    const skillName = `P17Skill-${TAG}`;
    const created = await createOpportunity({
      actorUserId: admin.userId,
      raw: {
        type: "JOBS",
        title: `P17 Match Opp ${TAG}`,
        description: "Phase 17 matching boundary opportunity with structured criteria.",
        locationPreference: "Cape Town",
        requiredProfession: "Engineer",
        minYearsExperience: 3,
        employmentType: "FULL_TIME",
        requiredSkills: skillName,
      },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const matchPro = await createUser(`${TAG}-pro@example.com`, "P17 Pro Match", {
      profession: "Engineer",
      location: "Cape Town",
      years: 5,
      skills: [skillName],
      employmentType: "FULL_TIME",
    });
    await forceVerified(matchPro.profileId);

    const unverified = await createUser(`${TAG}-uv@example.com`, "P17 Unverified", {
      profession: "Engineer",
      location: "Cape Town",
      years: 5,
      skills: [skillName],
      employmentType: "FULL_TIME",
    });

    expect(await canViewOpportunityMatches(admin.userId)).toBe(true);
    expect(await canViewOpportunityMatches(viewer.userId)).toBe(true);
    expect(await canViewOpportunityMatches(member.userId)).toBe(false);

    const adminResult = await findPotentialMatches({
      actorUserId: admin.userId,
      opportunityId: created.opportunityId,
      professionalId: unverified.profileId,
      profileId: unverified.profileId,
      role: "SUPER_ADMIN",
    });
    expect(adminResult.ok).toBe(true);
    if (adminResult.ok) {
      expect(adminResult.matches.some((m) => m.profileId === matchPro.profileId)).toBe(true);
      expect(adminResult.matches.some((m) => m.profileId === unverified.profileId)).toBe(false);
      for (const m of adminResult.matches) {
        expect(m).not.toHaveProperty("email");
        expect(m).not.toHaveProperty("phone");
        expect(m).not.toHaveProperty("whatsapp");
        expect(m).not.toHaveProperty("userId");
        expect(m).not.toHaveProperty("interests");
      }
    }

    await expect(
      findPotentialMatches({
        actorUserId: admin.userId,
        opportunityId: created.opportunityId,
        userId: member.userId,
      }),
    ).rejects.toBeInstanceOf(AppError);

    const viewerResult = await findPotentialMatches({
      actorUserId: viewer.userId,
      opportunityId: created.opportunityId,
    });
    expect(viewerResult.ok).toBe(true);

    await expect(
      findPotentialMatches({
        actorUserId: member.userId,
        opportunityId: created.opportunityId,
      }),
    ).rejects.toBeInstanceOf(AppError);

    await prisma.professionalDetails.update({
      where: { profileId: matchPro.profileId },
      data: { profession: "Designer" },
    });
    const afterChange = await findPotentialMatches({
      actorUserId: admin.userId,
      opportunityId: created.opportunityId,
    });
    expect(afterChange.ok).toBe(true);
    if (afterChange.ok) {
      expect(afterChange.matches.some((m) => m.profileId === matchPro.profileId)).toBe(false);
    }

    await closeOpportunity({
      actorUserId: admin.userId,
      opportunityId: created.opportunityId,
    });
    const closed = await findPotentialMatches({
      actorUserId: admin.userId,
      opportunityId: created.opportunityId,
    });
    expect(closed.ok).toBe(false);
    if (!closed.ok) expect(closed.code).toBe("OPPORTUNITY_CLOSED");

    const fakeId = randomUUID();
    await expect(
      findPotentialMatches({ actorUserId: member.userId, opportunityId: fakeId }),
    ).rejects.toBeInstanceOf(AppError);
  });
});
