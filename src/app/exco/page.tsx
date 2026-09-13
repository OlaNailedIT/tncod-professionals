import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { Surface } from "@/components/ui";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { getAuthenticatedUser } from "@/server/auth/session";
import {
  hasExcoDashboardAccess,
  loadExcoDashboardMetrics,
} from "@/features/exco/dashboard-metrics";

function MetricCard({
  label,
  value,
  description,
  metricKey,
}: {
  label: string;
  value: number;
  description?: string;
  metricKey: string;
}) {
  return (
    <Surface className="flex flex-col gap-1 p-4" bordered data-metric={metricKey}>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tabular-nums tracking-tight" data-metric-value={metricKey}>
        {value}
      </p>
      {description ? <p className="text-caption text-muted-foreground">{description}</p> : null}
    </Surface>
  );
}

export default async function ExcoDashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(sanitizeNextPath("/exco"))}`);
  }

  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }

  const metrics = await loadExcoDashboardMetrics(user.userId);

  return (
    <ProductExcoShell pathname="/exco" title="EXCO dashboard">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Operational overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only attention metrics. Professional verification, business verification, and
            directory publication remain independent. This page does not change verification or
            publication state.
          </p>
        </div>

        <section aria-labelledby="attention-heading" className="flex flex-col gap-3">
          <h2 id="attention-heading" className="text-lg font-medium">
            Needs attention
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard
              metricKey="pending-professional-verification"
              label="Pending professional verification"
              value={metrics.pendingProfessionalVerification}
              description="Profiles awaiting EXCO action (Pending or Under review)."
            />
            <MetricCard
              metricKey="pending-business-verification"
              label="Pending business verification"
              value={metrics.pendingBusinessVerification}
              description="Businesses submitted or under review — not professionals."
            />
          </div>
        </section>

        <section aria-labelledby="overview-heading" className="flex flex-col gap-3">
          <h2 id="overview-heading" className="text-lg font-medium">
            Overview
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              metricKey="new-registrations-30d"
              label="New registrations (last 30 days)"
              value={metrics.newRegistrationsLast30Days}
              description={`Members registered since ${metrics.registrationWindowStartIso.slice(0, 10)} (UTC).`}
            />
            <MetricCard
              metricKey="total-professionals"
              label="Total professionals"
              value={metrics.totalProfessionals}
            />
            <MetricCard
              metricKey="complete-profiles"
              label="Complete profiles"
              value={metrics.completeProfiles}
              description="Phase 8 completion algorithm = 100%."
            />
            <MetricCard metricKey="businesses" label="Businesses" value={metrics.businesses} />
            <MetricCard
              metricKey="seeking-employment"
              label="Seeking employment"
              value={metrics.seekingEmployment}
              description="professional_situation = Job seeker."
            />
            <MetricCard
              metricKey="verified-professionals"
              label="Verified professionals"
              value={metrics.verifiedProfessionals}
            />
            <MetricCard
              metricKey="verified-businesses"
              label="Verified businesses"
              value={metrics.verifiedBusinesses}
            />
          </div>
        </section>

        <section aria-labelledby="actions-heading" className="flex flex-col gap-3">
          <h2 id="actions-heading" className="text-lg font-medium">
            Quick actions
          </h2>
          <p className="text-sm text-muted-foreground">
            Deep links to existing operational surfaces only. No mutations from this dashboard.
          </p>
          <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <li>
              <Link
                href="/exco/analytics"
                className="inline-flex rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium underline-offset-2 hover:underline"
              >
                Analytics
              </Link>
            </li>
            <li>
              <Link
                href="/exco/professionals"
                className="inline-flex rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium underline-offset-2 hover:underline"
              >
                Find professionals
              </Link>
            </li>
            <li>
              <Link
                href="/exco/businesses"
                className="inline-flex rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium underline-offset-2 hover:underline"
              >
                View businesses
              </Link>
            </li>
          </ul>
          <p className="text-caption text-muted-foreground">
            Review profiles actions, verification queue UI, job-seeker workspace, and export
            directory remain deferred until separately authorized.
          </p>
        </section>
      </div>
    </ProductExcoShell>
  );
}
