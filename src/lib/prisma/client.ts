import "server-only";

import { PrismaClient } from "@prisma/client";

/**
 * Privileged database access. Bypasses PostgreSQL RLS.
 * Callers MUST authorize in the domain layer first (Phase 3 SEC-016).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
