/**
 * Phase 8 closeout — database sanity only (read/inspect + idempotent seed check).
 * Does not weaken RLS or invent schema.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRawUnsafe<Array<{ column_name: string; data_type: string }>>(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'professional_details'
       AND column_name IN ('industry_id', 'opportunity_preferences')
     ORDER BY column_name`,
  );

  const fk = await prisma.$queryRawUnsafe<Array<{ conname: string }>>(
    `SELECT conname FROM pg_constraint WHERE conname = 'professional_details_industry_id_fkey'`,
  );

  const industries = await prisma.industry.findMany({
    select: { id: true, name: true, slug: true, isActive: true },
    orderBy: { slug: "asc" },
  });
  const slugCounts = await prisma.$queryRawUnsafe<Array<{ slug: string; c: bigint }>>(
    `SELECT slug, COUNT(*)::bigint AS c FROM public.industries GROUP BY slug HAVING COUNT(*) > 1`,
  );

  const rls = await prisma.$queryRawUnsafe<Array<{ relname: string; relrowsecurity: boolean }>>(
    `SELECT c.relname, c.relrowsecurity
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname IN ('professional_details', 'profiles', 'industries', 'business_professionals')
     ORDER BY c.relname`,
  );

  const policies = await prisma.$queryRawUnsafe<Array<{ tablename: string; policyname: string; cmd: string }>>(
    `SELECT tablename, policyname, cmd
     FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename IN ('professional_details', 'industries')
     ORDER BY tablename, policyname`,
  );

  const migrations = await prisma.$queryRawUnsafe<Array<{ version: string }>>(
    `SELECT version FROM supabase_migrations.schema_migrations
     WHERE version LIKE '20260908%' OR version LIKE '%phase8%'
     ORDER BY version`,
  ).catch(() => [] as Array<{ version: string }>);

  const report = {
    columns,
    industryFkPresent: fk.length === 1,
    industryCount: industries.length,
    duplicateSlugs: slugCounts.map((r) => ({ slug: r.slug, count: Number(r.c) })),
    industries: industries.map((i) => ({ name: i.name, slug: i.slug, isActive: i.isActive })),
    rls,
    policies,
    recordedMigrations: migrations,
  };

  console.log(JSON.stringify(report, null, 2));

  const ok =
    columns.some((c) => c.column_name === "industry_id") &&
    columns.some((c) => c.column_name === "opportunity_preferences") &&
    fk.length === 1 &&
    slugCounts.length === 0 &&
    industries.some((i) => i.slug === "technology") &&
    rls.every((r) => r.relrowsecurity === true);

  if (!ok) {
    console.error("PHASE8_DB_CLOSEOUT_FAIL");
    process.exit(1);
  }
  console.log("PHASE8_DB_CLOSEOUT_PASS");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
