"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/server/auth/session";
import {
  upsertMyVisibilityPreference,
  upsertMyVisibilityPreferencesBatch,
} from "@/features/visibility/own-preferences";

export async function upsertVisibilityPreferenceAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const result = await upsertMyVisibilityPreference(user.userId, raw);
  if (result.ok) {
    // Revalidate directory consumers only. Revalidating /settings/privacy remounts this
    // client form and clears save feedback mid-interaction.
    revalidatePath("/professionals");
    revalidatePath("/professionals", "layout");
  }
  return result;
}

export async function upsertVisibilityPreferencesBatchAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const result = await upsertMyVisibilityPreferencesBatch(user.userId, raw);
  if (result.ok) {
    revalidatePath("/professionals");
    revalidatePath("/professionals", "layout");
  }
  return result;
}
