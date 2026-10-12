/**
 * Load member index for planning / idempotency from Prisma (read-only queries).
 */
import type { PrismaClient } from "@prisma/client";
import type { ExistingMemberHit } from "@/features/legacy-migration/types";
import {
  buildEmptyMemberIndex,
  type DryRunMemberIndex,
} from "@/features/legacy-migration/dry-run";

export async function loadMemberIndexFromPrisma(
  prisma: PrismaClient,
): Promise<DryRunMemberIndex> {
  const index = buildEmptyMemberIndex();
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      phone: true,
      profile: { select: { id: true, legacyImport: true } },
    },
  });
  for (const u of users) {
    if (!u.profile) continue;
    const hit: ExistingMemberHit = {
      userId: u.id,
      profileId: u.profile.id,
      email: u.email.toLowerCase(),
      phone: u.phone,
      matchedBy: "email",
    };
    index.byEmail.set(u.email.toLowerCase(), { ...hit, matchedBy: "email" });
    if (u.phone) index.byPhone.set(u.phone, { ...hit, matchedBy: "phone" });
  }
  const imported = await prisma.legacyImportRow.findMany({
    where: { profileId: { not: null } },
    select: { sourceRowHash: true },
  });
  for (const row of imported) index.importedHashes.add(row.sourceRowHash);
  return index;
}
