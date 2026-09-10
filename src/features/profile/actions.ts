"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { updateOwnMemberProfile } from "@/features/profile/own-profile";

export async function updateOwnProfileAction(raw: unknown) {
  const user = await requireAuthenticatedUser();
  const result = await updateOwnMemberProfile(user.userId, raw);
  if (result.ok) {
    revalidatePath("/profile");
    revalidatePath("/profile/edit");
    revalidatePath("/dashboard");
  }
  return result;
}
