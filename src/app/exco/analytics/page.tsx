import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { Surface } from "@/components/ui";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { getAuthenticatedUser } from "@/server/auth/session";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import { loadExcoAnalytics } from "@/features/exco/analytics/load-analytics";
import { parseAnalyticsQuery } from "@/features/exco/analytics/query";
import { AnalyticsFiltersForm } from "@/features/exco/analytics/filters-form";
import { getPrisma } from "@/lib/prisma/client";
import type { PrivacyBreakdownRow } from "@/features/exco/analytics/privacy";
import type { UnavailableMetric } from "@/features/exco/analytics/compute-analytics";

function StatCard({
  label,
  value,
  description,
  metricKey,
}: {
  label: string;
  value: string | number;
  description?: string;
  metricKey: string;
}) {
  return (
    <Surface className="flex flex-col gap-1 p-4" bordered data-metric={metricKey}>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p
        className="text-3xl font-semibold tabular-nums tracking-tight"
        data-metric-value={metricKey}
      >
        {value}
      </p>
      {description ? <p className="text-caption text-muted-foreground">{description}</p> : null}
    </Surface>
  );
}

function BreakdownTable({
  caption,
  rows,
  emptyLabel,
}: {
  caption: string;
  rows: PrivacyBreakdownRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[16rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">
              Group
            </th>
            <th scope="col" className="py-2 font-medium tabular-nums">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border/60">
              <td className="py-2 pr-3">
                {row.suppressed ? (
                  <span className="italic text-muted-foreground">
                    Small groups (suppressed for privacy)
                  </span>
                ) : (
                  row.key
                )}
              </td>
              <td className="py-2 tabular-nums">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UnavailableList({ items }: { items: UnavailableMetric[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-col gap-2">
      {items.map((item) => (
        <li
          key={item.key}
          className="rounded-md border border-dashed border-border px-3 py-2 text-sm"
          data-metric-unavailable={item.key}
        >
          <p className="font-medium">
            {item.label}{" "}
            <span className="text-caption font-normal uppercase text-muted-foreground">
              {item.status}
            </span>
          </p>
          <p className="text-muted-foreground">{item.reason}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function ExcoAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(sanitizeNextPath("/exco/analytics"))}`);
  }
  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = parseAnalyticsQuery(params);
  const analytics = await loadExcoAnalytics(user.userId, query);

  const industries = await getPrisma().industry.findMany({
    where: { isActive: true },
    select: { name: true },
    orderBy: { name: "asc" },
  });

  const rateLabel = (r: number | null) => (r == null ? "—" : `${r}%`);

  return (
    <ProductExcoShell pathname="/exco/analytics" title="EXCO analytics">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Analytics & operational intelligence</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Read-only aggregate view for EXCO. Counts never expose member contact details.
            Composition groups with fewer than three members are combined for privacy.
            Preference is not the same as directory publication.
          </p>
          <p className="text-caption text-muted-foreground">
            Population in view:{" "}
            <span className="font-medium text-foreground tabular-nums">
              {analytics.memberPopulation}
            </span>{" "}
            professionals · Computed {analytics.computedAt.slice(0, 19)}Z ·{" "}
            <Link href="/exco" className="underline-offset-2 hover:underline">
              Back to dashboard
            </Link>
          </p>
        </header>

        <AnalyticsFiltersForm
          query={query}
          industryOptions={industries.map((i) => i.name)}
        />

        <section aria-labelledby="community-heading" className="flex flex-col gap-4">
          <h2 id="community-heading" className="text-lg font-medium">
            Community
          </h2>
          <p className="text-sm text-muted-foreground">
            Who we have — professions, industries, locations, situations, and businesses.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              metricKey="businesses-total"
              label="Businesses"
              value={analytics.community.businessesTotal}
              description="Unique businesses (not inflated by multiple professionals)."
            />
            <StatCard
              metricKey="member-population"
              label="Professionals in view"
              value={analytics.memberPopulation}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface bordered className="flex flex-col gap-2 p-4">
              <h3 className="font-medium">Professions</h3>
              <BreakdownTable
                caption="Profession counts"
                rows={analytics.community.professions}
                emptyLabel="No profession data in this view."
              />
            </Surface>
            <Surface bordered className="flex flex-col gap-2 p-4">
              <h3 className="font-medium">Industries</h3>
              <BreakdownTable
                caption="Industry counts"
                rows={analytics.community.industries}
                emptyLabel="No industry data in this view."
              />
            </Surface>
            <Surface bordered className="flex flex-col gap-2 p-4">
              <h3 className="font-medium">Locations</h3>
              <BreakdownTable
                caption="Location counts"
                rows={analytics.community.locations}
                emptyLabel="No location data in this view."
              />
            </Surface>
            <Surface bordered className="flex flex-col gap-2 p-4">
              <h3 className="font-medium">Employment / professional situation</h3>
              <BreakdownTable
                caption="Employment and professional situation counts"
                rows={analytics.community.situations}
                emptyLabel="No employment/situation data in this view."
              />
            </Surface>
          </div>
          {analytics.community.businessesByStatus.length > 0 ? (
            <Surface bordered className="p-4">
              <h3 className="mb-2 font-medium">Businesses by status</h3>
              <ul className="flex flex-wrap gap-3 text-sm">
                {analytics.community.businessesByStatus.map((row) => (
                  <li key={row.key} className="tabular-nums">
                    <span className="text-muted-foreground">{row.key}:</span> {row.count}
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}
        </section>

        <section aria-labelledby="needs-heading" className="flex flex-col gap-4">
          <h2 id="needs-heading" className="text-lg font-medium">
            Needs
          </h2>
          <p className="text-sm text-muted-foreground">
            Structured signals only. Interest preferences are not matched opportunities.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              metricKey="job-seekers"
              label="Seeking employment"
              value={analytics.needs.jobSeekers}
              description="Members whose situation is Job seeker"
            />
            <StatCard
              metricKey="mentorship-interest"
              label="Mentorship interest"
              value={analytics.needs.mentorshipInterest}
              description="Preference signal — not mentor capacity"
            />
            <StatCard
              metricKey="training-interest"
              label="Training interest"
              value={analytics.needs.trainingInterest}
            />
            <StatCard
              metricKey="collaboration-interest"
              label="Collaboration interest"
              value={analytics.needs.collaborationInterest}
            />
            <StatCard
              metricKey="referrals-interest"
              label="Referrals interest"
              value={analytics.needs.referralsInterest}
              description="Not a client-need metric"
            />
          </div>
          <UnavailableList items={analytics.needs.unavailable} />
        </section>

        <section aria-labelledby="capacity-heading" className="flex flex-col gap-4">
          <h2 id="capacity-heading" className="text-lg font-medium">
            Capacity
          </h2>
          <p className="text-sm text-muted-foreground">
            What members can offer — skills, services, and business owners.
          </p>
          <StatCard
            metricKey="business-owners"
            label="Business owners"
            value={analytics.capacity.businessOwners}
            description="Distinct professionals with OWNER relationship on a non-deleted business."
          />
          <div className="grid gap-6 lg:grid-cols-2">
            <Surface bordered className="flex flex-col gap-2 p-4">
              <h3 className="font-medium">Skills</h3>
              <BreakdownTable
                caption="Skill counts"
                rows={analytics.capacity.skills}
                emptyLabel="No skill data in this view."
              />
            </Surface>
            <Surface bordered className="flex flex-col gap-2 p-4">
              <h3 className="font-medium">Services</h3>
              <BreakdownTable
                caption="Service counts"
                rows={analytics.capacity.services}
                emptyLabel="No service data in this view."
              />
            </Surface>
          </div>
          <UnavailableList items={analytics.capacity.unavailable} />
        </section>

        <section aria-labelledby="health-heading" className="flex flex-col gap-4">
          <h2 id="health-heading" className="text-lg font-medium">
            System health
          </h2>
          <p className="text-sm text-muted-foreground">
            Platform health using locked Phase 8 completion and Phase 10 registration rules.
            Verification rates stay separate for professionals and businesses.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              metricKey="new-registrations"
              label={`New platform registrations (${analytics.systemHealth.registrationDays}d)`}
              value={analytics.systemHealth.newRegistrations}
              description={`Since ${analytics.systemHealth.registrationWindowStartIso.slice(0, 10)} UTC. Excludes historical import profiles. Not affected by community filters.`}
            />
            <StatCard
              metricKey="complete-profiles"
              label="Complete profiles"
              value={analytics.systemHealth.completeProfiles}
              description={`Rate ${rateLabel(analytics.systemHealth.profileCompletionRate)} (Phase 8 = 100%).`}
            />
            <StatCard
              metricKey="verified-professionals"
              label="Verified professionals"
              value={analytics.systemHealth.verifiedProfessionals}
              description={`Rate ${rateLabel(analytics.systemHealth.professionalVerificationRate)}`}
            />
            <StatCard
              metricKey="verified-businesses"
              label="Verified businesses"
              value={analytics.systemHealth.verifiedBusinesses}
              description={`Rate ${rateLabel(analytics.systemHealth.businessVerificationRate)} of ${analytics.systemHealth.businessesTotal} businesses.`}
            />
            <StatCard
              metricKey="directory-effective"
              label="Directory published"
              value={analytics.systemHealth.directoryEffectivePublished}
              description="VERIFIED + DIRECTORY + public slug. Not preference."
            />
          </div>
          <Surface bordered className="p-4">
            <h3 className="mb-1 font-medium">Identity visibility preferences</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Member preference for the identity group — separate from effective directory
              publication.
            </p>
            {analytics.systemHealth.identityPreferenceByLevel.length === 0 ? (
              <p className="text-sm text-muted-foreground">No members in view.</p>
            ) : (
              <ul className="flex flex-wrap gap-3 text-sm">
                {analytics.systemHealth.identityPreferenceByLevel.map((row) => (
                  <li key={row.key} className="tabular-nums">
                    <span className="text-muted-foreground">{row.key}:</span> {row.count}
                  </li>
                ))}
              </ul>
            )}
          </Surface>
          <UnavailableList items={analytics.systemHealth.unavailable} />
        </section>
      </div>
    </ProductExcoShell>
  );
}
