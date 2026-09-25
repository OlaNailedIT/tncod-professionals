import "server-only";

import { getPrisma } from "@/lib/prisma/client";

/**
 * The single application-identity boundary for privileged Prisma access.
 * An Auth session alone is insufficient: the application account and profile
 * must both still be active.
 */
export async function activeIdentityExists(userId: string): Promise<boolean> {
  const prisma = getPrisma();
  const identity = await prisma.user.findFirst({
    where: {
      id: userId,
      accountStatus: "ACTIVE",
      deletedAt: null,
      profile: { is: { deletedAt: null } },
    },
    select: { id: true },
  });
  return Boolean(identity);
}
