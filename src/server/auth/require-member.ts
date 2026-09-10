import "server-only";

import { redirect } from "next/navigation";
import { getAuthenticatedUser, type AuthenticatedIdentity } from "@/server/auth/session";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

/** Redirect anonymous users to sign-in with a safe return path. */
export async function requireMemberPage(
  returnPath: string,
): Promise<AuthenticatedIdentity> {
  const user = await getAuthenticatedUser();
  if (!user) {
    const next = sanitizeNextPath(returnPath);
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }
  return user;
}
