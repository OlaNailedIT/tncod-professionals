/**
 * Phase 14 DB closeout — disposable Supabase.
 * Run: npx tsx -r ./scripts/register-server-only.cjs scripts/phase14-db-closeout.ts
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  getMyVisibilityPreferences,
  upsertMyVisibilityPreference,
} from "../src/features/visibility/own-preferences";
import {
  getDirectoryProfessionalBySlug,
  listDirectoryProfessionals,
} from "../src/features/directory/list";
import { assertPublicProfessionalShape } from "../src/security/projections";

const prisma = new PrismaClient();
const TAG = `p14-closeout-${Date.now()}`;

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

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
          location: "Cape Town",
          headline: "Closeout",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          professionalDetails: {
            create: { profession: "Designer", opportunityPreferences: {} },
          },
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  return { userId: id, profileId: profile.id };
}

async function main() {
  console.log("Phase 14 DB closeout…", TAG);

  const table = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'profile_visibility_preferences'
     ) AS e`,
  );
  assert(table[0]?.e === true, "preference table missing");

  const a = await createMember(`${TAG}-a@example.com`, "P14 Closeout A");
  const b = await createMember(`${TAG}-b@example.com`, "P14 Closeout B");
  const view = await getMyVisibilityPreferences(a.userId);
  assert(view.preferences.length === 10, "expected 10 groups");
  assert(
    view.preferences.find((p) => p.groupKey === "contact")?.preference === "PRIVATE",
    "contact default",
  );

  const deny = await upsertMyVisibilityPreference(a.userId, {
    groupKey: "contact",
    preference: "PUBLIC",
  });
  assert(!deny.ok, "contact PUBLIC must deny");

  const forged = await upsertMyVisibilityPreference(a.userId, {
    groupKey: "location",
    preference: "PRIVATE",
    profileId: b.profileId,
  });
  assert(!forged.ok, "forged profileId must deny");

  const slug = `${TAG}-listed`;
  await forceStatus(a.profileId, "VERIFIED", "DIRECTORY", slug);
  await upsertMyVisibilityPreference(a.userId, {
    groupKey: "location",
    preference: "PRIVATE",
  });

  const detail = await getDirectoryProfessionalBySlug(slug);
  assert(detail != null, "eligible listed");
  assertPublicProfessionalShape(detail!);
  assert(detail!.location === null, "location withheld");
  assert(detail!.displayName === "P14 Closeout A", "identity still public");

  const idDeny = await upsertMyVisibilityPreference(a.userId, {
    groupKey: "identity",
    preference: "PRIVATE",
  });
  assert(!idDeny.ok, "P14-21 identity lock");

  await forceStatus(a.profileId, "VERIFIED", "MEMBERS_ONLY", slug);
  assert((await getDirectoryProfessionalBySlug(slug)) === null, "known slug after unpublish");

  const list = await listDirectoryProfessionals({
    q: "P14 Closeout A",
    profession: "",
    industry: "",
    location: "",
    service: "",
    page: 1,
  });
  assert(!list.items.some((i) => i.publicSlug === slug), "unpublished not listed");

  // Consent table must not gain rows from preference upserts
  const consents = await prisma.consent.count({ where: { userId: a.userId } });
  assert(consents === 0, "no fabricated consent");

  console.log("PHASE 14 DB CLOSEOUT PASS");
}

main()
  .catch((e) => {
    console.error("PHASE 14 DB CLOSEOUT FAIL", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
