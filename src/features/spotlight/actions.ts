"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { updateOwnSpotlightInterest } from "@/features/spotlight/own-interest";
import {
  archiveSpotlight,
  createSpotlight,
  publishSpotlight,
  restoreSpotlight,
} from "@/features/spotlight/commands";

function readInterestedFlag(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "object" && raw !== null && "interested" in raw) {
    const value = (raw as { interested: unknown }).interested;
    if (typeof value === "boolean") return value;
    if (value === "true" || value === "1") return true;
    if (value === "false" || value === "0") return false;
    return Boolean(value);
  }
  return false;
}

export async function updateSpotlightInterestAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const interested = readInterestedFlag(raw);

  // Ignore forged userId / profileId — ownership from session only.
  const result = await updateOwnSpotlightInterest(user.userId, interested);
  if (result.ok) {
    // Do not revalidate /settings — remount clears client save feedback (same as Phase 14 privacy).
    revalidatePath("/exco/spotlight");
  }
  return result;
}

export async function createSpotlightAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const body = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const result = await createSpotlight({
    actorUserId: user.userId,
    profileId: String(body.profileId ?? ""),
    verified: body.verified,
    profileComplete: body.profileComplete,
    headshotAvailable: body.headshotAvailable,
    spotlightInterest: body.spotlightInterest,
  });
  if (result.ok) {
    revalidatePath("/exco/spotlight");
  }
  return result;
}

export async function publishSpotlightAction(spotlightId: string) {
  const user = await requireAuthenticatedUser();
  const result = await publishSpotlight({
    actorUserId: user.userId,
    spotlightId,
  });
  if (result.ok) {
    revalidatePath("/exco/spotlight");
  }
  return result;
}

export async function archiveSpotlightAction(spotlightId: string) {
  const user = await requireAuthenticatedUser();
  const result = await archiveSpotlight({
    actorUserId: user.userId,
    spotlightId,
  });
  if (result.ok) {
    revalidatePath("/exco/spotlight");
  }
  return result;
}

export async function restoreSpotlightAction(spotlightId: string) {
  const user = await requireAuthenticatedUser();
  const result = await restoreSpotlight({
    actorUserId: user.userId,
    spotlightId,
  });
  if (result.ok) {
    revalidatePath("/exco/spotlight");
  }
  return result;
}
