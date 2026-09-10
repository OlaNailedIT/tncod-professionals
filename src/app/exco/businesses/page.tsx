import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { EmptyState, StatusBadge, Surface } from "@/components/ui";
import { getAuthenticatedUser } from "@/server/auth/session";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import { listExcoBusinesses } from "@/features/business/exco-business";
import { businessVerificationIntent } from "@/features/business/verification-status";

export default async function ExcoBusinessesPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(sanitizeNextPath("/exco/businesses"))}`);
  }
  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }

  const businesses = await listExcoBusinesses(user.userId);

  return (
    <ProductExcoShell pathname="/exco/businesses" title="Businesses">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Business review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review submitted businesses. Approving a business does not verify professionals or
            publish to the directory.
          </p>
        </div>
        {businesses.length === 0 ? (
          <EmptyState title="No businesses in the review set">
            Submitted and reviewed businesses will appear here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {businesses.map((b) => (
              <li key={b.id}>
                <Surface className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={`/exco/businesses/${b.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {b.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {b.industryName ?? "No category"} · {b.associationCount} association
                      {b.associationCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <StatusBadge intent={businessVerificationIntent(b.businessStatus)}>
                    {b.verificationLabel}
                  </StatusBadge>
                </Surface>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ProductExcoShell>
  );
}
