/**
 * Disposable local proof: Auth user + public.users + profile + professional_details.
 * Mirrors Phase 6 registration persistence chain (Auth → users → profile → details).
 * Run: npx tsx scripts/phase6-registration-proof.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

function unwrap(value: string): string {
  let current = value.trim();
  while (
    (current.startsWith('"') && current.endsWith('"') && current.length >= 2) ||
    (current.startsWith("'") && current.endsWith("'") && current.length >= 2)
  ) {
    current = current.slice(1, -1).trim();
  }
  return current;
}

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = unwrap(trimmed.slice(eq + 1));
      process.env[key] = value;
    }
  } catch {
    // rely on process env
  }
}

loadEnvFile();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return unwrap(value);
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const service = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const prisma = new PrismaClient();
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const stamp = Date.now();
  const email = `phase6.proof.${stamp}@tncod.test`;
  const phone = `2782${String(stamp).slice(-7)}`;

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {},
  });
  if (error || !created.user) {
    throw new Error(`Auth create failed: ${error?.message}`);
  }
  const userId = created.user.id;

  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, email, phone },
    update: { email, phone },
  });

  const memberRole = await prisma.role.findUnique({ where: { name: "MEMBER" } });
  if (memberRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId, roleId: memberRole.id } },
      create: { userId, roleId: memberRole.id },
      update: {},
    });
  }

  const profile = await prisma.profile.create({
    data: {
      userId,
      displayName: "Phase 6 Proof",
      professionalSituation: "Employee",
      profileStatus: "REGISTERED",
      verificationStatus: "NOT_REVIEWED",
      visibilityStatus: "PRIVATE",
      professionalDetails: {
        create: {
          profession: "Proof engineer",
          lookingForSummary: "Evidence",
          offeringSummary: "Scripts",
        },
      },
    },
  });

  const authUser = await admin.auth.admin.getUserById(userId);
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const dbProfile = await prisma.profile.findUniqueOrThrow({
    where: { id: profile.id },
    include: { professionalDetails: true },
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        report: {
          authUserExists: Boolean(authUser.data.user),
          publicUserIdMatches: dbUser.id === userId,
          email,
          phone: dbUser.phone,
          profileStatus: dbProfile.profileStatus,
          verificationStatus: dbProfile.verificationStatus,
          visibilityStatus: dbProfile.visibilityStatus,
          profession: dbProfile.professionalDetails?.profession,
          memberRoleAssigned: Boolean(memberRole),
        },
      },
      null,
      2,
    ),
  );

  await prisma.professionalDetails.deleteMany({ where: { profileId: profile.id } });
  await prisma.profile.delete({ where: { id: profile.id } });
  await prisma.userRole.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await admin.auth.admin.deleteUser(userId);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(JSON.stringify({ ok: false, error: String(error) }));
  process.exit(1);
});
