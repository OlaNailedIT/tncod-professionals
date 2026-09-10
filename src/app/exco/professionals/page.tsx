import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { EmptyState, StatusBadge, Surface } from "@/components/ui";
import { getAuthenticatedUser } from "@/server/auth/session";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import { parseExcoProfessionalsQuery, excoProfessionalsQueryString } from "@/features/exco/professionals/query";
import {
  listActiveIndustriesForExco,
  listExcoProfessionals,
} from "@/features/exco/professionals/list";
import { ExcoProfessionalsFiltersForm } from "@/features/exco/professionals/filters-form";
import {
  presentVerificationStatus,
  presentVisibilityStatus,
} from "@/lib/status/presentations";

export default async function ExcoProfessionalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(sanitizeNextPath("/exco/professionals"))}`);
  }
  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }

  const raw = await searchParams;
  const query = parseExcoProfessionalsQuery(raw);
  const [result, industries] = await Promise.all([
    listExcoProfessionals(user.userId, query),
    listActiveIndustriesForExco(),
  ]);

  const baseQuery = { ...query };

  return (
    <ProductExcoShell pathname="/exco/professionals" title="Professionals">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Professionals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find and open professional records. Professional verification, directory visibility, and
            profile completion remain independent. This list does not edit or verify records.
          </p>
        </div>

        <ExcoProfessionalsFiltersForm query={query} industries={industries} />

        <p
          className="text-sm text-muted-foreground"
          data-list-total={result.total}
          data-page-size={result.pageSize}
          data-page={result.page}
        >
          {result.total === 0
            ? "No professionals match these filters."
            : `Showing ${(result.page - 1) * result.pageSize + 1}–${Math.min(result.page * result.pageSize, result.total)} of ${result.total}`}
        </p>

        {result.items.length === 0 ? (
          <EmptyState title="No matching professionals">
            Try clearing filters or broadening search. Empty results are not an empty platform.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {result.items.map((item) => (
              <li key={item.id}>
                <Surface className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/exco/professionals/${item.id}${excoProfessionalsQueryString(baseQuery)}`}
                      className="font-medium underline-offset-2 hover:underline"
                      data-professional-id={item.id}
                    >
                      {item.displayName}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[item.profession, item.industryName, item.location].filter(Boolean).join(" · ") ||
                        "No profession / location yet"}
                    </p>
                    {item.email ? (
                      <p className="mt-0.5 text-caption text-muted-foreground">{item.email}</p>
                    ) : null}
                    <p className="mt-1 text-caption text-muted-foreground">
                      Completion {item.completionPercent}%
                      {item.isJobSeeker ? " · Job seeker" : ""}
                      {item.isBusinessOwner ? " · Business owner" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge intent={presentVerificationStatus(item.verificationStatus).intent}>
                      {item.verificationLabel}
                    </StatusBadge>
                    <StatusBadge intent={presentVisibilityStatus(item.visibilityStatus).intent}>
                      {item.visibilityLabel}
                    </StatusBadge>
                  </div>
                </Surface>
              </li>
            ))}
          </ul>
        )}

        {result.pageCount > 1 ? (
          <nav aria-label="Pagination" className="flex flex-wrap items-center gap-3">
            {result.page > 1 ? (
              <Link
                className="text-sm font-medium underline-offset-2 hover:underline"
                href={`/exco/professionals${excoProfessionalsQueryString({ ...baseQuery, page: result.page - 1 })}`}
              >
                Previous
              </Link>
            ) : null}
            <span className="text-sm text-muted-foreground">
              Page {result.page} of {result.pageCount}
            </span>
            {result.page < result.pageCount ? (
              <Link
                className="text-sm font-medium underline-offset-2 hover:underline"
                href={`/exco/professionals${excoProfessionalsQueryString({ ...baseQuery, page: result.page + 1 })}`}
              >
                Next
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </ProductExcoShell>
  );
}
