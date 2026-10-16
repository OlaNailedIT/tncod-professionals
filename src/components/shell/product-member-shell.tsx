import { MemberShell } from "@/components/shell/member-shell";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import { getAuthenticatedUser } from "@/server/auth/session";

/**
 * Product wrapper: MemberShell with Next.js link navigation.
 * EXCO visibility uses the same server role check as `/exco`.
 */
export async function ProductMemberShell({
  pathname,
  children,
  title,
}: {
  pathname: string;
  children: React.ReactNode;
  title?: string;
}) {
  const user = await getAuthenticatedUser();
  const showExco = user ? await hasExcoDashboardAccess(user.userId) : false;

  return (
    <MemberShell pathname={pathname} mode="link" title={title} showExco={showExco}>
      {children}
    </MemberShell>
  );
}
