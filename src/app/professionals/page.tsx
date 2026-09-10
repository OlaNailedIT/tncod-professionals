import type { Metadata } from "next";
import Link from "next/link";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { EmptyState } from "@/components/ui";
import { DirectoryFiltersForm } from "@/features/directory/filters-form";
import { DirectoryProfessionalCard } from "@/features/directory/professional-card";
import {
  listDirectoryIndustryOptions,
  listDirectoryProfessionals,
} from "@/features/directory/list";
import {
  directoryQueryString,
  parseDirectoryQuery,
} from "@/features/directory/query";

export const metadata: Metadata = {
  title: "Professionals Directory — TNCOD Professionals",
  description:
    "Browse verified professionals intentionally published to the TNCOD Professionals Directory.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ProfessionalsDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query = parseDirectoryQuery(raw);
  const [result, industries] = await Promise.all([
    listDirectoryProfessionals(query),
    listDirectoryIndustryOptions(),
  ]);

  const hasFilters = Boolean(
    query.q || query.profession || query.industry || query.location || query.service,
  );

  return (
    <ProductPublicShell pathname="/professionals">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Professionals Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Only professionals who are verified and intentionally published appear here. Profile
            completion, verification, and directory publication remain separate.
          </p>
        </div>

        <DirectoryFiltersForm query={query} industries={industries} />

        <p
          className="text-sm text-muted-foreground"
          data-list-total={result.total}
          data-page-size={result.pageSize}
          data-page={result.page}
        >
          {result.total === 0
            ? hasFilters
              ? "No professionals match these filters."
              : "No published professionals yet."
            : `Showing ${(result.page - 1) * result.pageSize + 1}–${Math.min(result.page * result.pageSize, result.total)} of ${result.total}`}
        </p>

        {result.items.length === 0 ? (
          <EmptyState title={hasFilters ? "No professionals found" : "Directory is empty"}>
            {hasFilters
              ? "Try clearing filters or broadening your search."
              : "Professionals appear here only after EXCO verifies and publishes them."}
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {result.items.map((item) => (
              <li key={item.publicSlug}>
                <DirectoryProfessionalCard item={item} />
              </li>
            ))}
          </ul>
        )}

        {result.pageCount > 1 ? (
          <nav className="flex flex-wrap items-center gap-3" aria-label="Pagination">
            {result.page > 1 ? (
              <Link
                href={`/professionals${directoryQueryString({ ...query, page: result.page - 1 })}`}
                className="text-sm underline-offset-2 hover:underline"
              >
                Previous
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">Previous</span>
            )}
            <span className="text-sm text-muted-foreground">
              Page {result.page} of {result.pageCount}
            </span>
            {result.page < result.pageCount ? (
              <Link
                href={`/professionals${directoryQueryString({ ...query, page: result.page + 1 })}`}
                className="text-sm underline-offset-2 hover:underline"
              >
                Next
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">Next</span>
            )}
          </nav>
        ) : null}
      </div>
    </ProductPublicShell>
  );
}
