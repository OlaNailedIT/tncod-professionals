import "server-only";

import type { BusinessStatus, VerificationStatus } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";
import { assertExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import {
  BUSINESS_TAB,
  PROFESSIONAL_TAB,
  parseVerificationTab,
  queueStatusIntent,
  toQueueItemBusiness,
  toQueueItemProfessional,
  type VerificationQueueItem,
  type VerificationQueueTab,
} from "@/features/exco/verification/queue-model";

export type { VerificationQueueItem, VerificationQueueTab };
export { parseVerificationTab, queueStatusIntent };

export async function listVerificationQueue(
  actorUserId: string,
  tab: VerificationQueueTab,
): Promise<VerificationQueueItem[]> {
  await assertExcoDashboardAccess(actorUserId);
  const prisma = getPrisma();

  const proStatuses =
    tab === "attention"
      ? (["PENDING", "UNDER_REVIEW"] as VerificationStatus[])
      : PROFESSIONAL_TAB[tab];
  const bizStatuses =
    tab === "attention"
      ? (["SUBMITTED", "PENDING_REVIEW"] as BusinessStatus[])
      : BUSINESS_TAB[tab];

  const [profiles, businesses] = await Promise.all([
    prisma.profile.findMany({
      where: {
        deletedAt: null,
        verificationStatus: { in: proStatuses },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        professionalDetails: { select: { profession: true } },
      },
    }),
    prisma.business.findMany({
      where: {
        deletedAt: null,
        businessStatus: { in: bizStatuses },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        industry: { select: { name: true } },
      },
    }),
  ]);

  const items: VerificationQueueItem[] = [
    ...profiles.map((p) =>
      toQueueItemProfessional({
        id: p.id,
        displayName: p.displayName,
        profession: p.professionalDetails?.profession ?? null,
        verificationStatus: p.verificationStatus,
        updatedAt: p.updatedAt,
        tab,
      }),
    ),
    ...businesses.map((b) =>
      toQueueItemBusiness({
        id: b.id,
        name: b.name,
        industryName: b.industry?.name ?? null,
        businessStatus: b.businessStatus,
        updatedAt: b.updatedAt,
        tab,
      }),
    ),
  ];

  items.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  return items;
}
