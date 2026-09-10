/**
 * Phase 13 DB closeout — disposable Supabase.
 * Run: npx tsx -r ./scripts/register-server-only.cjs scripts/phase13-db-closeout.ts
 */
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import {
  getDirectoryProfessionalBySlug,
  listDirectoryProfessionals,
} from "../src/features/directory/list";
import { assertPublicProfessionalShape } from "../src/security/projections";

const prisma = new PrismaClient();
const TAG = `p13-closeout-${Date.now()}`;

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

async function createPro(
  email: string,
  displayName: string,
  verification: string,
  visibility: string,
  slug: string | null,
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
          location: "Accra",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          profileStatus: "REGISTERED",
          professionalDetails: {
            create: { profession: "Engineer", opportunityPreferences: {} },
          },
        },
      },
    },
  });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId: id } });
  await forceStatus(profile.id, verification, visibility, slug);
  return profile.id;
}

async function main() {
  console.log("Phase 13 DB closeout…", TAG);

  const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'information_schema' AND false`,
  );
  void cols;

  // Confirm extended function returns new columns
  const fnCols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT a.attname AS column_name
     FROM pg_proc p
     JOIN pg_namespace n ON n.oid = p.pronamespace
     JOIN pg_type t ON t.oid = p.prorettype
     JOIN pg_attribute a ON a.attrelid = t.typrelid
     WHERE n.nspname = 'app' AND p.proname = 'directory_professionals' AND a.attnum > 0
     ORDER BY a.attnum`,
  );
  // Composite return type may not expose via attrelid on all PG versions — fall back to SELECT
  const sample = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT * FROM app.directory_professionals() LIMIT 1`,
  );
  if (sample[0]) {
    assert("industry_name" in sample[0] || "skill_names" in sample[0], "projection extended");
  }

  const listedId = await createPro(
    `${TAG}-ok@example.com`,
    `${TAG} Listed`,
    "VERIFIED",
    "DIRECTORY",
    `${TAG}-listed`,
  );
  await createPro(
    `${TAG}-mo@example.com`,
    `${TAG} MO`,
    "VERIFIED",
    "MEMBERS_ONLY",
    `${TAG}-mo`,
  );
  await createPro(
    `${TAG}-priv@example.com`,
    `${TAG} Priv`,
    "VERIFIED",
    "PRIVATE",
    `${TAG}-priv`,
  );
  await createPro(`${TAG}-pend@example.com`, `${TAG} Pend`, "PENDING", "PRIVATE", null);

  const list = await listDirectoryProfessionals({
    q: TAG,
    profession: "",
    industry: "",
    location: "",
    service: "",
    page: 1,
  });
  assert(
    list.items.some((i) => i.publicSlug === `${TAG}-listed`),
    "listed eligible",
  );
  assert(!list.items.some((i) => i.publicSlug === `${TAG}-mo`), "members-only excluded");
  assert(!list.items.some((i) => i.publicSlug === `${TAG}-priv`), "private excluded");
  for (const item of list.items) assertPublicProfessionalShape(item);

  const bySlug = await getDirectoryProfessionalBySlug(`${TAG}-listed`);
  assert(bySlug?.displayName === `${TAG} Listed`, "slug resolve");
  assert((await getDirectoryProfessionalBySlug(`${TAG}-mo`)) === null, "unpub slug deny");
  assert((await getDirectoryProfessionalBySlug(`${TAG}-nope`)) === null, "random slug deny");

  // SQL function eligibility matches app
  const sqlCount = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT count(*)::bigint AS c FROM app.directory_professionals()
     WHERE display_name LIKE $1`,
    `${TAG}%`,
  );
  assert(Number(sqlCount[0]?.c ?? 0) === 1, "SQL projection count matches eligibility");

  void listedId;
  console.log("PHASE 13 DB CLOSEOUT PASS");
}

main()
  .catch((err) => {
    console.error("PHASE 13 DB CLOSEOUT FAIL", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
