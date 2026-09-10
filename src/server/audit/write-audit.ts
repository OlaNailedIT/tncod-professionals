import "server-only";

import type { Prisma } from "@prisma/client";
import { getPrisma } from "@/lib/prisma/client";

export async function writeAuditLog(input: {
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Prisma.InputJsonValue;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? undefined,
    },
  });
}
