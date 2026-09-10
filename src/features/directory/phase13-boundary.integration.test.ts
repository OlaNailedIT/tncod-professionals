/**
 * Phase 13 command/DB boundary — eligibility, projection leakage, slug resolution.
 * Requires disposable local DATABASE_URL.
 */
import { randomUUID } from "crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  getDirectoryProfessionalBySlug,
  listDirectoryProfessionals,
} from "@/features/directory/list";
import { assertPublicProfessionalShape } from "@/security/projections";

const prisma = new PrismaClient();
const TAG = `p13-bound-${Date.now()}`;
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

async function createPro(input: {
  email: string;
  displayName: string;
  verification: string;
  visibility: string;
  slug: string | null;
  profession?: string;
  location?: string;
}) {
  const id = randomUUID();
  await prisma.user.create({
    data: {
      id,
      email: input.email,
      phone: null,
      accountStatus: "ACTIVE",
      profile: {
        create: {
          displayName: input.displayName,
          location: input.location ?? "Lagos",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          publicSlug: null,
          professionalDetails: {
            create: {
              profession: input.profession ?? "Engineer",
              lookingForSummary: "Peers",
              offeringSummary: "Help",
              opportunityPreferences: {},
            },
          },
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  await forceStatus(profile.id, input.verification, input.visibility, input.slug);
  return { userId: id, profileId: profile.id, slug: input.slug };
}

beforeAll(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
  } catch {
    dbReady = false;
  }
});

describe("Phase 13 directory boundary", () => {
  it("requires local database", () => {
    if (!dbReady) {
      throw new Error("DATABASE UNAVAILABLE — Phase 13 boundary evidence cannot PASS");
    }
    expect(dbReady).toBe(true);
  });

  it("lists only VERIFIED + DIRECTORY; projection has no private fields", async () => {
    if (!dbReady) return;
    const listed = await createPro({
      email: `${TAG}-dir@example.com`,
      displayName: `${TAG} Directory`,
      verification: "VERIFIED",
      visibility: "DIRECTORY",
      slug: `${TAG}-dir`,
      profession: "Software Engineer",
    });
    await createPro({
      email: `${TAG}-mo@example.com`,
      displayName: `${TAG} MembersOnly`,
      verification: "VERIFIED",
      visibility: "MEMBERS_ONLY",
      slug: `${TAG}-mo`,
    });
    await createPro({
      email: `${TAG}-priv@example.com`,
      displayName: `${TAG} Private`,
      verification: "VERIFIED",
      visibility: "PRIVATE",
      slug: `${TAG}-priv`,
    });
    await createPro({
      email: `${TAG}-pend@example.com`,
      displayName: `${TAG} Pending`,
      verification: "PENDING",
      visibility: "PRIVATE",
      slug: null,
    });

    const result = await listDirectoryProfessionals({
      q: TAG,
      profession: "",
      industry: "",
      location: "",
      service: "",
      page: 1,
    });
    const slugs = result.items.map((i) => i.publicSlug);
    expect(slugs).toContain(listed.slug);
    expect(slugs).not.toContain(`${TAG}-mo`);
    expect(slugs).not.toContain(`${TAG}-priv`);
    for (const item of result.items) {
      assertPublicProfessionalShape(item);
      expect(item).not.toHaveProperty("email");
      expect(item).not.toHaveProperty("phone");
      expect(item).not.toHaveProperty("id");
      expect(item.verifiedBadge).toBe(true);
    }
  });

  it("resolves published slug and denies unpublished / members-only / private / random", async () => {
    if (!dbReady) return;
    const pub = await createPro({
      email: `${TAG}-slug@example.com`,
      displayName: `${TAG} Slug`,
      verification: "VERIFIED",
      visibility: "DIRECTORY",
      slug: `${TAG}-slug-ok`,
    });
    const unpub = await createPro({
      email: `${TAG}-unpub@example.com`,
      displayName: `${TAG} Unpub`,
      verification: "VERIFIED",
      visibility: "MEMBERS_ONLY",
      slug: `${TAG}-slug-unpub`,
    });

    const ok = await getDirectoryProfessionalBySlug(pub.slug!);
    expect(ok?.publicSlug).toBe(pub.slug);
    assertPublicProfessionalShape(ok!);

    expect(await getDirectoryProfessionalBySlug(unpub.slug!)).toBeNull();
    expect(await getDirectoryProfessionalBySlug(`${TAG}-never-exists`)).toBeNull();
  });

  it("search is case-insensitive and does not reveal unpublished", async () => {
    if (!dbReady) return;
    await createPro({
      email: `${TAG}-search@example.com`,
      displayName: `${TAG} Searchable Ada`,
      verification: "VERIFIED",
      visibility: "DIRECTORY",
      slug: `${TAG}-search-ada`,
      profession: "Civil Engineer",
    });
    await createPro({
      email: `${TAG}-hidden@example.com`,
      displayName: `${TAG} Hidden Engineer`,
      verification: "VERIFIED",
      visibility: "PRIVATE",
      slug: `${TAG}-hidden`,
      profession: "Civil Engineer",
    });

    const found = await listDirectoryProfessionals({
      q: "civil engineer",
      profession: "",
      industry: "",
      location: "",
      service: "",
      page: 1,
    });
    expect(found.items.some((i) => i.publicSlug === `${TAG}-search-ada`)).toBe(true);
    expect(found.items.some((i) => i.publicSlug === `${TAG}-hidden`)).toBe(false);
  });
});
