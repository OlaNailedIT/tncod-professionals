/* eslint-disable no-console */
/**
 * Read-only masked ACTIVE (non-deleted) users created on/after a date.
 * Never prints full email/phone. Never mutates.
 *
 *   npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-masked-active-since.ts [ISO-date]
 */
import { getPrisma } from "../src/lib/prisma/client";
import { maskEmail, maskPhone } from "../src/features/registration/identifier-reclaim";

async function main() {
  const sinceIso = process.argv[2] || "2026-10-08T00:00:00Z";
  const since = new Date(sinceIso);
  const prisma = getPrisma();

  const users = await prisma.user.findMany({
    where: { deletedAt: null, createdAt: { gte: since } },
    select: {
      id: true,
      email: true,
      phone: true,
      accountStatus: true,
      createdAt: true,
      profile: {
        select: {
          deletedAt: true,
          visibilityStatus: true,
          verificationStatus: true,
          professionalDetails: { select: { id: true } },
        },
      },
      userRoles: { select: { role: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = [];
  for (const u of users) {
    let authExists: boolean | "error" = false;
    try {
      const auth = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id::text AS id FROM auth.users WHERE id = ${u.id}::uuid LIMIT 1
      `;
      authExists = auth.length > 0;
    } catch {
      authExists = "error";
    }
    rows.push({
      id: `${u.id.slice(0, 8)}…`,
      email_masked: maskEmail(u.email),
      phone_masked: maskPhone(u.phone),
      account_status: u.accountStatus,
      created_at: u.createdAt.toISOString(),
      auth_exists: authExists,
      profile_active: Boolean(u.profile && u.profile.deletedAt == null),
      has_professional_details: Boolean(u.profile?.professionalDetails),
      has_member: u.userRoles.some((r) => r.role.name === "MEMBER"),
      visibility_status: u.profile?.visibilityStatus ?? null,
      verification_status: u.profile?.verificationStatus ?? null,
    });
  }

  console.log(JSON.stringify({ since: sinceIso, count: rows.length, rows }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
