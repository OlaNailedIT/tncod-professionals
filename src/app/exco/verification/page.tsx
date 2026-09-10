import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { StatusBadge, Surface } from "@/components/ui";
import { getAuthenticatedUser } from "@/server/auth/session";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import {
  listVerificationQueue,
  parseVerificationTab,
  queueStatusIntent,
  type VerificationQueueTab,
} from "@/features/exco/verification/queue";

const TABS: { id: VerificationQueueTab; label: string }[] = [
  { id: "attention", label: "Needs attention" },
  { id: "pending", label: "Pending" },
  { id: "under_review", label: "Under review" },
  { id: "needs_clarification", label: "Needs clarification" },
  { id: "verified", label: "Verified" },
  { id: "rejected", label: "Rejected" },
];

export default async function ExcoVerificationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const tab = parseVerificationTab(raw.tab);
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(sanitizeNextPath("/exco/verification"))}`);
  }
  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }

  const items = await listVerificationQueue(user.userId, tab);

  return (
    <ProductExcoShell pathname="/exco/verification" title="Verification">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verification centre</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One queue for professional and business verification. Domains stay separate. Tabs are
            projections over canonical states — not a new status system.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Verification filters">
          {TABS.map((t) => {
            const active = t.id === tab;
            const href = `/exco/verification?tab=${t.id}`;
            return (
              <Link
                key={t.id}
                href={href}
                className={
                  active
                    ? "rounded-md bg-foreground px-3 py-1.5 text-sm text-background"
                    : "rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
                }
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {items.length === 0 ? (
          <Surface className="p-6">
            <p className="text-sm text-muted-foreground">No items in this view.</p>
          </Surface>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={`${item.domain}-${item.id}`}>
                <Link href={item.href} className="block">
                  <Surface className="p-4 transition-colors hover:bg-muted/40">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-caption uppercase tracking-wide text-muted-foreground">
                          {item.domain === "professional"
                            ? "Professional verification"
                            : "Business verification"}
                        </p>
                        <p className="mt-1 text-base font-medium text-foreground">{item.title}</p>
                        {item.subtitle ? (
                          <p className="mt-0.5 text-sm text-muted-foreground">{item.subtitle}</p>
                        ) : null}
                      </div>
                      <StatusBadge intent={queueStatusIntent(item.domain, item.statusKey)}>
                        {item.statusLabel}
                      </StatusBadge>
                    </div>
                  </Surface>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProductExcoShell>
  );
}
