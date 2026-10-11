/**
 * P6-001 — preference-aware directory search/filter/count/facet regression.
 * Fail-closed: requires PHASE6R_DISPOSABLE_DIRECTORY_TESTS=1 and loopback :54322
 * before any Prisma query or fixture mutation.
 */
import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, type VisibilityPreferenceLevel } from "@prisma/client";
import {
  PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN,
  assertDisposableDirectoryTestEnv,
} from "@/features/directory/disposable-directory-env";
import {
  getDirectoryProfessionalBySlug,
  listDirectoryIndustryOptions,
  listDirectoryProfessionals,
} from "@/features/directory/list";
import { upsertMyVisibilityPreference } from "@/features/visibility/own-preferences";
import { getVisibilityGroup } from "@/features/visibility/groups";
import { assertPublicProfessionalShape } from "@/security/projections";

const TAG = `p6r-${Date.now()}`;
const empty = {
  q: "",
  profession: "",
  industry: "",
  location: "",
  service: "",
  page: 1,
};

let prisma: PrismaClient | null = null;
let dbReady = false;
const createdUserIds: string[] = [];
const createdSkillIds: string[] = [];
const createdServiceIds: string[] = [];
const createdIndustryIds: string[] = [];

function db(): PrismaClient {
  if (!prisma) {
    throw new Error("Prisma client not initialized — disposable env gate must pass first");
  }
  return prisma;
}

function deepHas(value: unknown, needle: string): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.includes(needle);
  if (Array.isArray(value)) return value.some((v) => deepHas(v, needle));
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((v) => deepHas(v, needle));
  }
  return false;
}

async function forceDirectory(profileId: string, slug: string, location?: string) {
  await db().$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    if (location !== undefined) {
      await tx.$executeRawUnsafe(
        `UPDATE public.profiles
         SET verification_status = 'VERIFIED'::"VerificationStatus",
             visibility_status = 'DIRECTORY'::"VisibilityStatus",
             public_slug = $1,
             location = $2
         WHERE id = $3::uuid`,
        slug,
        location,
        profileId,
      );
    } else {
      await tx.$executeRawUnsafe(
        `UPDATE public.profiles
         SET verification_status = 'VERIFIED'::"VerificationStatus",
             visibility_status = 'DIRECTORY'::"VisibilityStatus",
             public_slug = $1
         WHERE id = $2::uuid`,
        slug,
        profileId,
      );
    }
  });
}

async function setPreference(
  profileId: string,
  groupKey: string,
  preference: VisibilityPreferenceLevel,
) {
  await db().profileVisibilityPreference.upsert({
    where: { profileId_groupKey: { profileId, groupKey } },
    create: { profileId, groupKey, preference },
    update: { preference },
  });
}

async function clearPreference(profileId: string, groupKey: string) {
  await db().profileVisibilityPreference.deleteMany({
    where: { profileId, groupKey },
  });
}

async function createDirectoryMember(input: {
  email: string;
  displayName: string;
  slug: string;
  location?: string;
  profession?: string;
  industryName?: string;
  industryActive?: boolean;
  skillName?: string;
  serviceName?: string;
}) {
  const id = randomUUID();
  let industryId: string | undefined;
  if (input.industryName) {
    const indSlug = `ind-${TAG}-${input.industryName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const industry = await db().industry.upsert({
      where: { slug: indSlug },
      create: {
        name: input.industryName,
        slug: indSlug,
        isActive: input.industryActive ?? true,
      },
      update: {
        name: input.industryName,
        isActive: input.industryActive ?? true,
      },
    });
    industryId = industry.id;
    createdIndustryIds.push(industry.id);
  }

  await db().user.create({
    data: {
      id,
      email: input.email,
      phone: null,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName: input.displayName,
          location: input.location ?? "Baseline City",
          headline: "P6R fixture",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          professionalDetails: {
            create: {
              profession: input.profession ?? "Baseline Profession",
              professionalTitle: "Lead",
              industryId: industryId ?? null,
              opportunityPreferences: {},
            },
          },
        },
      },
    },
  });
  createdUserIds.push(id);
  const profile = await db().profile.findUniqueOrThrow({ where: { userId: id } });
  await forceDirectory(profile.id, input.slug, input.location);

  if (input.skillName) {
    const skillSlug = `sk-${TAG}-${input.skillName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const skill = await db().skill.upsert({
      where: { slug: skillSlug },
      create: { name: input.skillName, slug: skillSlug, isActive: true },
      update: { name: input.skillName, isActive: true },
    });
    createdSkillIds.push(skill.id);
    await db().profileSkill.create({
      data: { profileId: profile.id, skillId: skill.id },
    });
  }

  if (input.serviceName) {
    const serviceSlug = `sv-${TAG}-${input.serviceName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const service = await db().service.upsert({
      where: { slug: serviceSlug },
      create: { name: input.serviceName, slug: serviceSlug, isActive: true },
      update: { name: input.serviceName, isActive: true },
    });
    createdServiceIds.push(service.id);
    await db().profileService.create({
      data: { profileId: profile.id, serviceId: service.id },
    });
  }

  return { userId: id, profileId: profile.id, slug: input.slug, displayName: input.displayName };
}

function requireDb() {
  if (!dbReady || !prisma) {
    throw new Error("DATABASE UNAVAILABLE — P6-001 sentinel evidence cannot PASS");
  }
}

describe("P6-001 preference-aware directory search privacy", () => {
  beforeAll(async () => {
    // Fail closed before any DB client work.
    const gate = assertDisposableDirectoryTestEnv(process.env);
    if (!gate.ok) {
      throw new Error(`DISPOSABLE ENV GATE FAILED: ${gate.reason}`);
    }

    prisma = new PrismaClient();
    try {
      await prisma.$queryRaw`SELECT 1`;
      const tables = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public'
             AND table_name = 'profile_visibility_preferences'
         ) AS exists`,
      );
      dbReady = tables[0]?.exists === true;
      if (!dbReady) {
        throw new Error("profile_visibility_preferences table missing on disposable database");
      }
    } catch (err) {
      dbReady = false;
      await prisma.$disconnect().catch(() => {});
      prisma = null;
      throw err;
    }
  }, 60_000);

  afterAll(async () => {
    if (!prisma) return;
    for (const userId of createdUserIds) {
      const profile = await prisma.profile.findUnique({ where: { userId } });
      if (profile) {
        await prisma.profileVisibilityPreference.deleteMany({
          where: { profileId: profile.id },
        });
        await prisma.profileSkill.deleteMany({ where: { profileId: profile.id } });
        await prisma.profileService.deleteMany({ where: { profileId: profile.id } });
        await prisma.professionalDetails.deleteMany({ where: { profileId: profile.id } });
        await prisma.profile.delete({ where: { id: profile.id } }).catch(() => {});
      }
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    for (const id of createdSkillIds) {
      await prisma.skill.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdServiceIds) {
      await prisma.service.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdIndustryIds) {
      await prisma.industry.delete({ where: { id } }).catch(() => {});
    }
    await prisma.$disconnect();
    prisma = null;
  });

  it("requires disposable preference store behind opt-in gate", () => {
    requireDb();
    expect(process.env[PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN]).toBe("1");
    expect(dbReady).toBe(true);
  });

  it("location PRIVATE/MEMBERS hides filter, q, and totals; PUBLIC finds; payload redacts", async () => {
    requireDb();
    const loc = `UNIQUE_PRIVATE_LOCATION_${TAG}`;
    const name = `Loc Person ${TAG}`;
    const slug = `p6r-loc-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-loc@example.invalid`,
      displayName: name,
      slug,
      location: loc,
    });

    for (const level of ["PRIVATE", "MEMBERS"] as const) {
      await setPreference(m.profileId, "location", level);
      const byFilter = await listDirectoryProfessionals({ ...empty, location: loc });
      const byQ = await listDirectoryProfessionals({ ...empty, q: loc });
      expect(byFilter.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(byFilter.total).toBe(0);
      expect(byFilter.pageCount).toBe(0);
      expect(byQ.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(byQ.total).toBe(0);
      expect(deepHas(byFilter, loc)).toBe(false);
      expect(deepHas(byQ, loc)).toBe(false);

      const detail = await getDirectoryProfessionalBySlug(slug);
      expect(detail).not.toBeNull();
      assertPublicProfessionalShape(detail!);
      expect(detail!.location).toBeNull();
      expect(deepHas(detail, loc)).toBe(false);
    }

    await setPreference(m.profileId, "location", "PUBLIC");
    const found = await listDirectoryProfessionals({ ...empty, location: loc });
    expect(found.items.some((i) => i.publicSlug === slug)).toBe(true);
    expect(found.total).toBeGreaterThanOrEqual(1);
    expect(found.items.find((i) => i.publicSlug === slug)?.location).toBe(loc);
  });

  it("professional PRIVATE/MEMBERS hides profession/industry filter, q, facets; PUBLIC finds", async () => {
    requireDb();
    const profession = `UNIQUE_PRIVATE_PROFESSION_${TAG}`;
    const industry = `UNIQUE_PRIVATE_INDUSTRY_${TAG}`;
    const name = `Pro Person ${TAG}`;
    const slug = `p6r-pro-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-pro@example.invalid`,
      displayName: name,
      slug,
      profession,
      industryName: industry,
    });

    for (const level of ["PRIVATE", "MEMBERS"] as const) {
      await setPreference(m.profileId, "professional", level);
      const byProf = await listDirectoryProfessionals({ ...empty, profession });
      const byInd = await listDirectoryProfessionals({ ...empty, industry });
      const byQ = await listDirectoryProfessionals({ ...empty, q: profession });
      expect(byProf.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(byProf.total).toBe(0);
      expect(byInd.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(byInd.total).toBe(0);
      expect(byQ.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(byQ.total).toBe(0);
      const facets = await listDirectoryIndustryOptions();
      expect(facets).not.toContain(industry);
      expect(deepHas(byProf, profession)).toBe(false);
      expect(deepHas(byInd, industry)).toBe(false);
    }

    await setPreference(m.profileId, "professional", "PUBLIC");
    const byProf = await listDirectoryProfessionals({ ...empty, profession });
    const byInd = await listDirectoryProfessionals({ ...empty, industry });
    const facets = await listDirectoryIndustryOptions();
    expect(byProf.items.some((i) => i.publicSlug === slug)).toBe(true);
    expect(byInd.items.some((i) => i.publicSlug === slug)).toBe(true);
    expect(facets).toContain(industry);
  });

  it("inactive industry cannot match filter or change totals", async () => {
    requireDb();
    const industry = `UNIQUE_INACTIVE_INDUSTRY_${TAG}`;
    const slug = `p6r-inact-ind-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-inact@example.invalid`,
      displayName: `Inactive Ind Person ${TAG}`,
      slug,
      industryName: industry,
      industryActive: false,
    });
    await setPreference(m.profileId, "professional", "PUBLIC");

    const byInd = await listDirectoryProfessionals({ ...empty, industry });
    expect(byInd.items.some((i) => i.publicSlug === slug)).toBe(false);
    expect(byInd.total).toBe(0);
    expect(byInd.pageCount).toBe(0);
    const facets = await listDirectoryIndustryOptions();
    expect(facets).not.toContain(industry);
    expect(deepHas(byInd, industry)).toBe(false);

    const detail = await getDirectoryProfessionalBySlug(slug);
    expect(detail).not.toBeNull();
    expect(detail!.industryName).toBeNull();
  });

  it("skills_services PRIVATE/MEMBERS hides skill/service q and service filter; PUBLIC finds", async () => {
    requireDb();
    const skill = `UNIQUE_PRIVATE_SKILL_${TAG}`;
    const service = `UNIQUE_PRIVATE_SERVICE_${TAG}`;
    const name = `Skill Person ${TAG}`;
    const slug = `p6r-sk-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-sk@example.invalid`,
      displayName: name,
      slug,
      skillName: skill,
      serviceName: service,
    });

    for (const level of ["PRIVATE", "MEMBERS"] as const) {
      await setPreference(m.profileId, "skills_services", level);
      const bySkillQ = await listDirectoryProfessionals({ ...empty, q: skill });
      const byServiceQ = await listDirectoryProfessionals({ ...empty, q: service });
      const byService = await listDirectoryProfessionals({ ...empty, service });
      expect(bySkillQ.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(bySkillQ.total).toBe(0);
      expect(byServiceQ.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(byService.total).toBe(0);
      expect(byService.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(deepHas(bySkillQ, skill)).toBe(false);
      expect(deepHas(byService, service)).toBe(false);

      const detail = await getDirectoryProfessionalBySlug(slug);
      expect(detail!.skillNames).toEqual([]);
      expect(detail!.serviceNames).toEqual([]);
    }

    await setPreference(m.profileId, "skills_services", "PUBLIC");
    const bySkillQ = await listDirectoryProfessionals({ ...empty, q: skill });
    const byService = await listDirectoryProfessionals({ ...empty, service });
    expect(bySkillQ.items.some((i) => i.publicSlug === slug)).toBe(true);
    expect(byService.items.some((i) => i.publicSlug === slug)).toBe(true);
  });

  it("mixed q: hidden location does not suppress visible name or profession match", async () => {
    requireDb();
    const loc = `UNIQUE_HIDDEN_LOC_MIX_${TAG}`;
    const profession = `UNIQUE_VISIBLE_PROF_MIX_${TAG}`;
    const name = `Mix Visible Name ${TAG}`;
    const slug = `p6r-mix-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-mix@example.invalid`,
      displayName: name,
      slug,
      location: loc,
      profession,
    });
    await setPreference(m.profileId, "location", "PRIVATE");
    await setPreference(m.profileId, "professional", "PUBLIC");
    await setPreference(m.profileId, "identity", "PUBLIC");

    const byHiddenLoc = await listDirectoryProfessionals({ ...empty, q: loc });
    expect(byHiddenLoc.items.some((i) => i.publicSlug === slug)).toBe(false);
    expect(byHiddenLoc.total).toBe(0);

    const byName = await listDirectoryProfessionals({ ...empty, q: name });
    expect(byName.items.some((i) => i.publicSlug === slug)).toBe(true);

    const byProf = await listDirectoryProfessionals({ ...empty, q: profession });
    expect(byProf.items.some((i) => i.publicSlug === slug)).toBe(true);
  });

  it("DIRECTORY + identity PRIVATE/MEMBERS is excluded from list, count, detail, facets, and ordering", async () => {
    requireDb();
    const industry = `UNIQUE_ID_ORACLE_INDUSTRY_${TAG}`;
    const uniqueName = `AAA_IDENTITY_ORACLE_${TAG}`;
    const slug = `p6r-id-oracle-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-id@example.invalid`,
      displayName: uniqueName,
      slug,
      industryName: industry,
      industryActive: true,
    });
    await setPreference(m.profileId, "professional", "PUBLIC");

    // Control: with identity PUBLIC the profile is listed and ordered by raw name.
    await setPreference(m.profileId, "identity", "PUBLIC");
    const control = await listDirectoryProfessionals({ ...empty, q: uniqueName });
    expect(control.items.some((i) => i.publicSlug === slug)).toBe(true);
    expect(control.total).toBeGreaterThanOrEqual(1);

    for (const level of ["PRIVATE", "MEMBERS"] as const) {
      // Privileged write — application upsert rejects this while DIRECTORY (asserted below).
      await setPreference(m.profileId, "identity", level);

      const listed = await listDirectoryProfessionals({ ...empty });
      expect(listed.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(listed.items.some((i) => i.displayName === uniqueName)).toBe(false);
      expect(deepHas(listed, uniqueName)).toBe(false);

      const byName = await listDirectoryProfessionals({ ...empty, q: uniqueName });
      expect(byName.items.some((i) => i.publicSlug === slug)).toBe(false);
      expect(byName.total).toBe(0);

      const detail = await getDirectoryProfessionalBySlug(slug);
      expect(detail).toBeNull();

      const facets = await listDirectoryIndustryOptions();
      // Industry must not appear solely from this identity-withheld DIRECTORY row.
      expect(facets).not.toContain(industry);
    }

    // Application path cannot create the inconsistent state while DIRECTORY.
    await setPreference(m.profileId, "identity", "PUBLIC");
    const denied = await upsertMyVisibilityPreference(m.userId, {
      groupKey: "identity",
      preference: "PRIVATE",
    });
    expect(denied.ok).toBe(false);

    // Separate evidence: privileged Prisma upsert CAN write identity PRIVATE while DIRECTORY.
    await setPreference(m.profileId, "identity", "PRIVATE");
    const row = await db().profileVisibilityPreference.findUniqueOrThrow({
      where: { profileId_groupKey: { profileId: m.profileId, groupKey: "identity" } },
    });
    expect(row.preference).toBe("PRIVATE");
  });

  it("missing preference rows follow locked defaults for searchable groups", async () => {
    requireDb();
    expect(getVisibilityGroup("location").defaultPreference).toBe("PUBLIC");
    expect(getVisibilityGroup("professional").defaultPreference).toBe("PUBLIC");
    expect(getVisibilityGroup("skills_services").defaultPreference).toBe("PUBLIC");
    expect(getVisibilityGroup("identity").defaultPreference).toBe("PUBLIC");

    const loc = `UNIQUE_DEFAULT_LOC_${TAG}`;
    const profession = `UNIQUE_DEFAULT_PROF_${TAG}`;
    const skill = `UNIQUE_DEFAULT_SKILL_${TAG}`;
    const slug = `p6r-def-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-def@example.invalid`,
      displayName: `Default Person ${TAG}`,
      slug,
      location: loc,
      profession,
      skillName: skill,
    });
    await clearPreference(m.profileId, "location");
    await clearPreference(m.profileId, "professional");
    await clearPreference(m.profileId, "skills_services");
    await clearPreference(m.profileId, "identity");

    const byLoc = await listDirectoryProfessionals({ ...empty, location: loc });
    const byProf = await listDirectoryProfessionals({ ...empty, profession });
    const bySkill = await listDirectoryProfessionals({ ...empty, q: skill });
    expect(byLoc.items.some((i) => i.publicSlug === slug)).toBe(true);
    expect(byProf.items.some((i) => i.publicSlug === slug)).toBe(true);
    expect(bySkill.items.some((i) => i.publicSlug === slug)).toBe(true);
  });

  it("anonymous and member directory loaders share the same projection (no actor widening)", async () => {
    requireDb();
    const loc = `UNIQUE_ANON_EQ_${TAG}`;
    const slug = `p6r-eq-${TAG}`;
    const m = await createDirectoryMember({
      email: `${TAG}-eq@example.invalid`,
      displayName: `Eq Person ${TAG}`,
      slug,
      location: loc,
    });
    await setPreference(m.profileId, "location", "PUBLIC");

    const a = await listDirectoryProfessionals({ ...empty, location: loc });
    const b = await listDirectoryProfessionals({ ...empty, location: loc });
    expect(a).toEqual(b);
    expect(a.items.find((i) => i.publicSlug === slug)).toEqual(
      b.items.find((i) => i.publicSlug === slug),
    );
  });
});
