import "server-only";

import { PrismaClient } from "@prisma/client";
import { runtimePrismaUrl } from "@/lib/prisma/runtime-url";

/**
 * Privileged database access. Bypasses PostgreSQL RLS.
 * Callers MUST authorize in the domain layer first (Phase 3 SEC-016).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const runtimeUrl = runtimePrismaUrl(process.env.DATABASE_URL);
    globalForPrisma.prisma = runtimeUrl && runtimeUrl !== process.env.DATABASE_URL
      ? new PrismaClient({ datasources: { db: { url: runtimeUrl } } })
      : new PrismaClient();
  }
  return globalForPrisma.prisma;
}
