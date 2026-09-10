import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { Surface } from "@/components/ui";
import { getAuthenticatedUser } from "@/server/auth/session";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import {
  canManageSpotlight,
  listExistingSpotlights,
  listSpotlightCandidates,
} from "@/features/spotlight/commands";
import {
  ExistingSpotlightsPanel,
  SpotlightCandidatesPanel,
} from "@/features/spotlight/spotlight-panels";

export default async function ExcoSpotlightPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const qRaw = raw.q;
  const q = typeof qRaw === "string" ? qRaw : Array.isArray(qRaw) ? (qRaw[0] ?? "") : "";

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(sanitizeNextPath("/exco/spotlight"))}`);
  }
  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }

  const [candidates, spotlights, canManage] = await Promise.all([
    listSpotlightCandidates(user.userId, q),
    listExistingSpotlights(user.userId),
    canManageSpotlight(user.userId),
  ]);

  return (
    <ProductExcoShell pathname="/exco/spotlight" title="Spotlight">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Spotlight</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Identify eligible professionals and create a Spotlight record that references their live
            profile. No duplicate profile entry. EXCO-only — not a public gallery.
          </p>
        </div>

        <form method="get" className="flex flex-wrap items-end gap-3" role="search">
          <div className="flex min-w-[12rem] flex-1 flex-col gap-1">
            <label htmlFor="spotlight-q" className="text-sm font-medium text-foreground">
              Search
            </label>
            <input
              id="spotlight-q"
              name="q"
              defaultValue={q}
              placeholder="Name, profession, or industry"
              className="h-10 rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-md bg-foreground px-4 text-sm text-background"
          >
            Search
          </button>
          {q ? (
            <Link
              href="/exco/spotlight"
              className="h-10 rounded-md border border-border px-4 text-sm leading-10 text-foreground"
            >
              Clear
            </Link>
          ) : null}
        </form>

        <section aria-labelledby="eligible-heading">
          <h2 id="eligible-heading" className="text-lg font-semibold tracking-tight">
            Eligible professionals
          </h2>
          <Surface className="mt-3 p-4">
            <SpotlightCandidatesPanel candidates={candidates} canManage={canManage} />
          </Surface>
        </section>

        <section aria-labelledby="existing-heading">
          <h2 id="existing-heading" className="text-lg font-semibold tracking-tight">
            Existing Spotlights
          </h2>
          <Surface className="mt-3 p-4">
            <ExistingSpotlightsPanel spotlights={spotlights} canManage={canManage} />
          </Surface>
        </section>
      </div>
    </ProductExcoShell>
  );
}
