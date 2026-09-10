/**
 * Phase 14 boundary + RLS adversarial — disposable Supabase required.
 */
import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  getMyVisibilityPreferences,
  upsertMyVisibilityPreference,
} from "@/features/visibility/own-preferences";
import {
  getDirectoryProfessionalBySlug,
  listDirectoryProfessionals,
} from "@/features/directory/list";
import { assertPublicProfessionalShape } from "@/security/projections";

const prisma = new PrismaClient();
const TAG = `p14-${Date.now()}`;
let dbReady = false;

async function forceStatus(
  profileId: string,
  verification: string,
  visibility: string,
  slug: string | null,
) {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL session_replication_role = replica`);
    await tx.$executeRawUnsafe(
      `UPDATE public.profiles
       SET verification_status = $1::"VerificationStatus",
           visibility_status = $2::"VisibilityStatus",
           public_slug = $3
       WHERE id = $4::uuid`,
      verification,
      visibility,
      slug,
      profileId,
    );
  });
}

async function createMember(email: string, displayName: string) {
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
          location: "Lagos",
          headline: "Builder",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          professionalDetails: {
            create: {
              profession: "Engineer",
              professionalTitle: "Lead",
              opportunityPreferences: {},
            },
          },
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  return { userId: id, profileId: profile.id };
}

describe("Phase 14 visibility boundary", () => {
  beforeAll(async () => {
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
    } catch {
      dbReady = false;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("requires preference table (cannot PASS without DB)", () => {
    expect(dbReady).toBe(true);
  });

  it("seeds defaults, persists upsert, rejects unsupported Public and IDOR", async () => {
    expect(dbReady).toBe(true);
    const a = await createMember(`${TAG}-a@example.com`, "P14 Member A");
    const b = await createMember(`${TAG}-b@example.com`, "P14 Member B");

    const defaults = await getMyVisibilityPreferences(a.userId);
    expect(defaults.preferences.find((p) => p.groupKey === "identity")?.preference).toBe(
      "PUBLIC",
    );
    expect(defaults.preferences.find((p) => p.groupKey === "contact")?.preference).toBe(
      "PRIVATE",
    );
    expect(defaults.preferences.find((p) => p.groupKey === "contact")?.editable).toBe(false);

    const ok = await upsertMyVisibilityPreference(a.userId, {
      groupKey: "location",
      preference: "PRIVATE",
    });
    expect(ok.ok).toBe(true);

    const deniedContact = await upsertMyVisibilityPreference(a.userId, {
      groupKey: "contact",
      preference: "PUBLIC",
    });
    expect(deniedContact.ok).toBe(false);

    const deniedBiz = await upsertMyVisibilityPreference(a.userId, {
      groupKey: "business",
      preference: "PUBLIC",
    });
    expect(deniedBiz.ok).toBe(false);

    const deniedOpp = await upsertMyVisibilityPreference(a.userId, {
      groupKey: "opportunities",
      preference: "PUBLIC",
    });
    expect(deniedOpp.ok).toBe(false);

    const forged = await upsertMyVisibilityPreference(a.userId, {
      groupKey: "location",
      preference: "PUBLIC",
      profileId: b.profileId,
    });
    expect(forged.ok).toBe(false);

    // Direct DB write as owner via privileged Prisma is allowed (bypass RLS);
    // application ownership still prevents A from targeting B through commands.
    const aPrefs = await prisma.profileVisibilityPreference.findMany({
      where: { profileId: a.profileId },
    });
    expect(aPrefs.length).toBeGreaterThanOrEqual(10);
  });

  it("withholds public fields and preserves eligibility / known-slug privacy", async () => {
    expect(dbReady).toBe(true);
    const m = await createMember(`${TAG}-pub@example.com`, "P14 Public Pro");
    const slug = `p14-public-${Date.now()}`;
    await forceStatus(m.profileId, "VERIFIED", "DIRECTORY", slug);

    await upsertMyVisibilityPreference(m.userId, {
      groupKey: "location",
      preference: "PRIVATE",
    });
    await upsertMyVisibilityPreference(m.userId, {
      groupKey: "professional",
      preference: "PRIVATE",
    });

    const detail = await getDirectoryProfessionalBySlug(slug);
    expect(detail).not.toBeNull();
    assertPublicProfessionalShape(detail!);
    expect(detail!.displayName).toBe("P14 Public Pro");
    expect(detail!.location).toBeNull();
    expect(detail!.profession).toBeNull();
    expect(detail!.professionalTitle).toBe("Lead");
    expect(JSON.stringify(detail)).not.toMatch(/email|phone|@example/i);

    // Identity Private while DIRECTORY rejected
    const idDeny = await upsertMyVisibilityPreference(m.userId, {
      groupKey: "identity",
      preference: "PRIVATE",
    });
    expect(idDeny.ok).toBe(false);

    // Unpublish → known slug unavailable
    await forceStatus(m.profileId, "VERIFIED", "MEMBERS_ONLY", slug);
    expect(await getDirectoryProfessionalBySlug(slug)).toBeNull();

    // Public pref without DIRECTORY still not listed
    await forceStatus(m.profileId, "NOT_REVIEWED", "PRIVATE", slug);
    await upsertMyVisibilityPreference(m.userId, {
      groupKey: "location",
      preference: "PUBLIC",
    });
    const list = await listDirectoryProfessionals({
      page: 1,
      q: "P14 Public Pro",
      profession: "",
      industry: "",
      location: "",
      service: "",
    });
    expect(list.items.some((i) => i.publicSlug === slug)).toBe(false);
  });

  it("RLS denies cross-member preference access via JWT role simulation", async () => {
    expect(dbReady).toBe(true);
    const a = await createMember(`${TAG}-rls-a@example.com`, "P14 RLS A");
    const b = await createMember(`${TAG}-rls-b@example.com`, "P14 RLS B");

    const denied = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claim.sub', $1, true)`,
        a.userId,
      );
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claim.role', 'authenticated', true)`,
      );
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated`);
      try {
        const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM public.profile_visibility_preferences WHERE profile_id = $1::uuid`,
          b.profileId,
        );
        return rows.length;
      } catch {
        return -1;
      } finally {
        await tx.$executeRawUnsafe(`RESET ROLE`);
      }
    });

    expect(denied === 0 || denied === -1).toBe(true);

    const allowed = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claim.sub', $1, true)`,
        a.userId,
      );
      await tx.$executeRawUnsafe(
        `SELECT set_config('request.jwt.claim.role', 'authenticated', true)`,
      );
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated`);
      try {
        const rows = await tx.$queryRawUnsafe<Array<{ id: string }>>(
          `SELECT id FROM public.profile_visibility_preferences WHERE profile_id = $1::uuid`,
          a.profileId,
        );
        return rows.length;
      } finally {
        await tx.$executeRawUnsafe(`RESET ROLE`);
      }
    });
    expect(allowed).toBeGreaterThanOrEqual(10);
  });
});
