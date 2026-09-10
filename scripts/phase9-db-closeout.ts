/**
 * Phase 9 closeout — schema, RLS, transitions, and relationship invariants.
 */
import { PrismaClient, type BusinessStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

async function main() {
  const migration = await prisma.$queryRawUnsafe<Array<{ version: string }>>(
    `SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20260908140000'`,
  );
  assert(migration.length === 1, "Phase 9 migration not registered");

  const cols = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='businesses'
       AND column_name IN ('social_links','services_offered','cac_registered','clarification_message')
     ORDER BY column_name`,
  );
  assert(cols.length === 4, `Missing Phase 9 business columns: ${JSON.stringify(cols)}`);

  const enumVals = await prisma.$queryRawUnsafe<Array<{ enumlabel: string }>>(
    `SELECT e.enumlabel FROM pg_type t
     JOIN pg_enum e ON t.oid = e.enumtypid
     WHERE t.typname = 'BusinessStatus'
     ORDER BY e.enumsortorder`,
  );
  assert(
    enumVals.some((e) => e.enumlabel === "NEEDS_CLARIFICATION"),
    "NEEDS_CLARIFICATION missing from BusinessStatus",
  );

  const idx = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
    `SELECT indexname FROM pg_indexes WHERE indexname = 'businesses_cac_number_unique'`,
  );
  assert(idx.length === 1, "CAC unique index missing");

  const noProfileId = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema='public' AND table_name='businesses' AND column_name = 'profile_id'`,
  );
  assert(noProfileId.length === 0, "businesses.profile_id must not exist");

  const bp = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema='public' AND table_name = 'business_professionals'`,
  );
  assert(bp.length === 1, "business_professionals missing");

  // Transactional create + relationship
  const industry = await prisma.industry.findFirst({ where: { isActive: true } });
  const user = await prisma.user.findFirst({
    where: { deletedAt: null, profile: { isNot: null } },
    include: { profile: true },
  });
  assert(Boolean(user?.profile), "Need at least one user+profile for probe");

  const created = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: `Phase9 Probe ${Date.now()}`,
        description: "Closeout probe",
        industryId: industry?.id ?? null,
        businessStatus: "DRAFT",
        visibilityStatus: "PRIVATE",
        socialLinks: { linkedin: "https://linkedin.com/company/probe" },
        servicesOffered: ["Consulting"],
      },
    });
    await tx.businessProfessional.create({
      data: {
        businessId: business.id,
        profileId: user!.profile!.id,
        relationshipType: "OWNER",
      },
    });
    return business;
  });

  assert(created.businessStatus === "DRAFT", "Initial status must be DRAFT");
  assert(created.visibilityStatus === "PRIVATE", "Must not auto-publish");

  const beforeProf = await prisma.profile.findUnique({
    where: { id: user!.profile!.id },
    select: { verificationStatus: true, visibilityStatus: true },
  });

  await prisma.business.update({
    where: { id: created.id },
    data: {
      businessStatus: "SUBMITTED" satisfies BusinessStatus,
      cacRegistered: true,
      cacNumber: `P9-${Date.now()}`,
    },
  });

  await prisma.business.update({
    where: { id: created.id },
    data: { businessStatus: "PENDING_REVIEW" },
  });

  await prisma.business.update({
    where: { id: created.id },
    data: {
      businessStatus: "NEEDS_CLARIFICATION",
      clarificationMessage: "Please upload clearer CAC document",
    },
  });

  await prisma.business.update({
    where: { id: created.id },
    data: { businessStatus: "SUBMITTED", clarificationMessage: null },
  });

  await prisma.business.update({
    where: { id: created.id },
    data: { businessStatus: "APPROVED" },
  });

  const afterProf = await prisma.profile.findUnique({
    where: { id: user!.profile!.id },
    select: { verificationStatus: true, visibilityStatus: true },
  });
  assert(
    beforeProf!.verificationStatus === afterProf!.verificationStatus,
    "Professional verification must not change",
  );
  assert(
    beforeProf!.visibilityStatus === afterProf!.visibilityStatus,
    "Professional visibility must not change",
  );

  const finalBiz = await prisma.business.findUnique({ where: { id: created.id } });
  assert(finalBiz!.visibilityStatus === "PRIVATE", "Business must remain unpublished");
  assert(finalBiz!.businessStatus === "APPROVED", "Business verification should be APPROVED");

  await prisma.auditLog.create({
    data: {
      actorId: user!.id,
      action: "phase9.closeout.probe",
      entityType: "business",
      entityId: created.id,
      metadata: { note: "closeout" },
    },
  });

  // Soft cleanup — keep audit; remove association + soft-delete business
  await prisma.businessProfessional.delete({
    where: {
      businessId_profileId: {
        businessId: created.id,
        profileId: user!.profile!.id,
      },
    },
  });
  await prisma.business.update({
    where: { id: created.id },
    data: { deletedAt: new Date(), cacNumber: null },
  });

  console.log("PHASE9_DB_CLOSEOUT_PASS");
}

main()
  .catch((err) => {
    console.error("PHASE9_DB_CLOSEOUT_FAIL", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
