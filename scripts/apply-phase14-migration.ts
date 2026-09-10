/**
 * Apply Phase 14 SQL migration to local disposable DB (not Prisma migrate).
 * Run: npx tsx scripts/apply-phase14-migration.ts
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("DB connected");

  const exists = await prisma.$queryRawUnsafe<Array<{ e: boolean }>>(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = 'profile_visibility_preferences'
     ) AS e`,
  );
  if (exists[0]?.e) {
    console.log("profile_visibility_preferences already exists — skip apply");
    return;
  }

  const sqlPath = path.join(
    process.cwd(),
    "supabase/migrations/20260909120000_phase14_visibility_preferences.sql",
  );
  const sql = fs.readFileSync(sqlPath, "utf8");
  await prisma.$executeRawUnsafe(sql);
  console.log("Phase 14 migration applied");

  const count = await prisma.$queryRawUnsafe<Array<{ c: bigint }>>(
    `SELECT COUNT(*)::bigint AS c FROM public.profile_visibility_preferences`,
  );
  console.log("preference rows:", count[0]?.c?.toString());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
