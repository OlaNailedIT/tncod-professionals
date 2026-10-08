import "server-only";

import { AppError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { assertTrustedUserId } from "@/security/authorization";
import { activeIdentityExists } from "@/server/auth/active-identity";

export type AuthenticatedIdentity = {
  userId: string;
  email: string | undefined;
};

/** Auth session plus the central active application-identity boundary. */
export async function getAuthenticatedUser(): Promise<AuthenticatedIdentity | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  if (!(await activeIdentityExists(data.user.id))) {
    await supabase.auth.signOut({ scope: "local" });
    return null;
  }
  return { userId: data.user.id, email: data.user.email };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedIdentity> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new AppError("UNAUTHENTICATED", "Authentication required");
  }
  return user;
}

export function rejectClientIdentity(authUserId: string, claimedUserId?: string | null): string {
  try {
    return assertTrustedUserId(authUserId, claimedUserId);
  } catch {
    throw new AppError("UNAUTHORIZED", "Client-supplied identity is not authoritative");
  }
}
