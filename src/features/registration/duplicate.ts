import "server-only";

import { getPrisma } from "@/lib/prisma/client";
import { normalizePhone } from "./phone";

export type DuplicateKind = "email" | "phone" | "both";

/**
 * Server-side duplicate check. Callers must use neutral UX copy — no identity leakage.
 * Phone comparison uses normalizePhone() canonical form stored on users.phone.
 */
export async function findRegistrationDuplicate(input: {
  email: string;
  phone: string;
}): Promise<{ duplicate: true; kind: DuplicateKind } | { duplicate: false }> {
  const prisma = getPrisma();
  const email = input.email.trim().toLowerCase();
  const phoneNorm = normalizePhone(input.phone);

  const byEmail = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true },
  });

  let byPhone = false;
  if (phoneNorm) {
    const phoneHit = await prisma.user.findFirst({
      where: { phone: phoneNorm, deletedAt: null },
      select: { id: true },
    });
    byPhone = Boolean(phoneHit);
  }

  if (byEmail && byPhone) return { duplicate: true, kind: "both" };
  if (byEmail) return { duplicate: true, kind: "email" };
  if (byPhone) return { duplicate: true, kind: "phone" };
  return { duplicate: false };
}

export const DUPLICATE_USER_MESSAGE =
  "It looks like you may already have a Professionals profile. Try signing in to continue.";
