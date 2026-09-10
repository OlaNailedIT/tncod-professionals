import type { Metadata } from "next";
import Link from "next/link";
import { Section, Stack } from "@/components/layout";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Alert, StatusBadge, Surface } from "@/components/ui";
import { requireMemberPage } from "@/server/auth/require-member";
import {
  canManageOpportunities,
  listOpportunitiesForMember,
} from "@/features/opportunities/commands";
import {
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABELS,
  opportunitiesQueryString,
  parseOpportunitiesQuery,
} from "@/features/opportunities/schema";
import { CreateOpportunityForm } from "@/features/opportunities/create-form";
import { InterestControls } from "@/features/opportunities/interest-controls";

export const metadata: Metadata = {
  title: "Opportunities — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireMemberPage("/opportunities");
  const raw = await searchParams;
  const query = parseOpportunitiesQuery(raw);
  const canManage = await canManageOpportunities(user.userId);
  const { items, total, page, pageSize } = await listOpportunitiesForMember(user.userId, query);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <ProductMemberShell pathname="/opportunities" title="Opportunities">
      <Section density="member">
        <Stack gap="comfortable">
          <div>
            <h1 className="text-h1 text-foreground">Opportunities</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Discover opportunities posted for the community. Expressing interest is a connection
              signal — not an application, message, or contact exchange.
            </p>
          </div>

          {canManage ? (
            <Surface className="p-4">
              <CreateOpportunityForm />
            </Surface>
          ) : null}

          <form method="get" className="flex flex-wrap items-end gap-3" role="search">
            <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
              <label htmlFor="opp-q" className="text-sm font-medium text-foreground">
                Search
              </label>
              <input
                id="opp-q"
                name="q"
                defaultValue={query.q}
                placeholder="Title or description"
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="opp-type" className="text-sm font-medium text-foreground">
                Type
              </label>
              <select
                id="opp-type"
                name="type"
                defaultValue={query.type === "ALL" ? "all" : query.type.toLowerCase()}
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="all">All</option>
                {OPPORTUNITY_TYPES.map((t) => (
                  <option key={t} value={t.toLowerCase()}>
                    {OPPORTUNITY_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="h-10 rounded-md bg-foreground px-4 text-sm text-background"
            >
              Apply
            </button>
            {query.q || query.type !== "ALL" ? (
              <Link
                href="/opportunities"
                className="h-10 rounded-md border border-border px-4 text-sm leading-10"
              >
                Clear
              </Link>
            ) : null}
          </form>

          {items.length === 0 ? (
            <Alert intent="neutral" title={query.q || query.type !== "ALL" ? "No results" : "No opportunities"}>
              {query.q || query.type !== "ALL"
                ? "No opportunities match that search or filter."
                : "There are no open opportunities right now."}
            </Alert>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.id}>
                  <Surface className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-caption uppercase tracking-wide text-muted-foreground">
                          {item.typeLabel}
                        </p>
                        <Link
                          href={`/opportunities/${item.id}`}
                          className="mt-1 block text-base font-medium text-foreground hover:underline"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                        {item.location ? (
                          <p className="mt-1 text-xs text-muted-foreground">{item.location}</p>
                        ) : null}
                      </div>
                      <StatusBadge intent={item.status === "ACTIVE" ? "success" : "neutral"}>
                        {item.statusLabel}
                      </StatusBadge>
                    </div>
                    <div className="mt-4">
                      <InterestControls
                        opportunityId={item.id}
                        initiallyInterested={item.interested}
                        acceptsInterest={item.status === "ACTIVE"}
                      />
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 ? (
            <nav className="flex flex-wrap gap-2" aria-label="Pagination">
              {page > 1 ? (
                <Link
                  href={`/opportunities${opportunitiesQueryString({ ...query, page: page - 1 })}`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  Previous
                </Link>
              ) : null}
              <span className="px-2 py-1.5 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={`/opportunities${opportunitiesQueryString({ ...query, page: page + 1 })}`}
                  className="rounded-md border border-border px-3 py-1.5 text-sm"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
