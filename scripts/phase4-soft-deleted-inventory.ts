/* eslint-disable no-console */
/**
 * Read-only masked inventory of soft-deleted public.users for reclaim planning.
 * Never prints full email/phone. Never mutates.
 *
 *   npx tsx -r ./scripts/register-server-only.cjs scripts/phase4-soft-deleted-inventory.ts
 */
import { getPrisma } from "../src/lib/prisma/client";
import { maskEmail, maskPhone } from "../src/features/registration/identifier-reclaim";

async function authExistsById(userId: string): Promise<boolean | "error"> {
  const prisma = getPrisma();
  try {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id::text AS id FROM auth.users WHERE id = ${userId}::uuid LIMIT 1
    `;
    return rows.length > 0;
  } catch {
    return "error";
  }
}

async function main() {
  const prisma = getPrisma();
  const rows = await prisma.user.findMany({
    where: { deletedAt: { not: null } },
    select: {
      id: true,
      email: true,
      phone: true,
      accountStatus: true,
      deletedAt: true,
      profile: { select: { deletedAt: true } },
    },
    orderBy: { deletedAt: "asc" },
  });

  let authAbsent = 0;
  let authPresent = 0;
  let authUnknown = 0;
  let phoneRetainedAmongAbsent = 0;
  const candidates: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const auth = await authExistsById(row.id);
    const profileActive = Boolean(row.profile && row.profile.deletedAt == null);
    const base = {
      userId: row.id,
      email_masked: maskEmail(row.email),
      phone_masked: maskPhone(row.phone),
      phone_retained: Boolean(row.phone),
      account_status: row.accountStatus,
      deleted_at: row.deletedAt?.toISOString() ?? null,
      profile_active: profileActive,
      auth_exists: auth === "error" ? "CHECK_FAILED" : auth,
    };

    if (auth === "error") {
      authUnknown += 1;
      candidates.push({ ...base, reclaim_candidate: false, note: "AUTH_CHECK_FAILED" });
      continue;
    }
    if (auth) {
      authPresent += 1;
      candidates.push({ ...base, reclaim_candidate: false, note: "AUTH_PRESENT" });
      continue;
    }
    authAbsent += 1;
    if (row.phone) phoneRetainedAmongAbsent += 1;
    const alreadyTombstone = row.email.toLowerCase().endsWith("@tombstone.invalid");
    candidates.push({
      ...base,
      reclaim_candidate: !alreadyTombstone && !profileActive,
      already_reclaimed: alreadyTombstone && !row.phone && !profileActive,
      note: alreadyTombstone ? "ALREADY_TOMBSTONED" : "AUTH_ABSENT_SOFT_DELETED",
    });
  }

  console.log(
    JSON.stringify(
      {
        recorded_at: new Date().toISOString(),
        soft_deleted_total: rows.length,
        auth_absent_soft_deleted: authAbsent,
        auth_present_soft_deleted: authPresent,
        auth_check_failed: authUnknown,
        phone_retained_among_auth_absent: phoneRetainedAmongAbsent,
        rows: candidates,
        guidance:
          "Owner must confirm each reclaim_candidate UUID before any --apply. Do not bulk-delete.",
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error("FATAL", e instanceof Error ? e.message : e);
  process.exit(1);
});
