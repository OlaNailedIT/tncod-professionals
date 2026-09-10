import "server-only";

import { getPrisma } from "@/lib/prisma/client";
import { AppError } from "@/lib/errors";
import { rejectClientIdentity } from "@/server/auth/session";
import {
  projectSpotlightProfessional,
  spotlightProfileInclude,
  type SpotlightProfileRow,
} from "@/features/spotlight/profile-mapper";

export async function updateOwnSpotlightInterest(
  authUserId: string,
  interested: boolean,
  claimedUserId?: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  rejectClientIdentity(authUserId, claimedUserId);
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: { id: authUserId, deletedAt: null, accountStatus: "ACTIVE" },
    select: { profile: { select: { id: true } } },
  });
  if (!user?.profile) {
    throw new AppError("NOT_FOUND", "Profile not found");
  }

  const next = Boolean(interested);
  await prisma.profile.update({
    where: { id: user.profile.id },
    data: { spotlightInterest: next },
  });

  // P15-09: withdrawing interest archives active Spotlights.
  if (!next) {
    await prisma.spotlight.updateMany({
      where: {
        profileId: user.profile.id,
        status: { not: "ARCHIVED" },
      },
      data: { status: "ARCHIVED", publishedAt: null },
    });
  }

  return { ok: true };
}

export async function getOwnSpotlightInterest(authUserId: string): Promise<boolean> {
  rejectClientIdentity(authUserId);
  const prisma = getPrisma();
  const profile = await prisma.profile.findFirst({
    where: { userId: authUserId, deletedAt: null },
    select: { spotlightInterest: true },
  });
  return profile?.spotlightInterest === true;
}

export async function loadProfileForSpotlight(profileId: string): Promise<SpotlightProfileRow | null> {
  const prisma = getPrisma();
  return prisma.profile.findFirst({
    where: { id: profileId },
    include: spotlightProfileInclude,
  }) as Promise<SpotlightProfileRow | null>;
}

export { projectSpotlightProfessional };
