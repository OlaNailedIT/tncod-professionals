import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductExcoShell } from "@/components/shell/product-exco-shell";
import { MetadataGroup, MetadataItem, StatusBadge, Surface } from "@/components/ui";
import { getAuthenticatedUser } from "@/server/auth/session";
import { loadPermissionKeys } from "@/server/authorization/require";
import { hasPermission } from "@/security/authorization";
import { PERMISSIONS } from "@/security/permissions";
import { AppError } from "@/lib/errors";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { hasExcoDashboardAccess } from "@/features/exco/dashboard-metrics";
import { loadExcoBusiness } from "@/features/business/exco-business";
import { ExcoBusinessReviewActions } from "@/features/business/exco-review-actions";
import { businessVerificationIntent } from "@/features/business/verification-status";

export default async function ExcoBusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(sanitizeNextPath(`/exco/businesses/${id}`))}`);
  }
  if (!(await hasExcoDashboardAccess(user.userId))) {
    redirect("/dashboard");
  }
  const perms = await loadPermissionKeys(user.userId);

  let business;
  try {
    business = await loadExcoBusiness(user.userId, id);
  } catch (err) {
    if (err instanceof AppError && err.code === "NOT_FOUND") notFound();
    if (err instanceof AppError && err.code === "UNAUTHORIZED") redirect("/dashboard");
    throw err;
  }

  const canVerify = hasPermission(perms, PERMISSIONS.BUSINESS_VERIFY);

  return (
    <ProductExcoShell pathname="/exco/businesses" title={business.name}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link href="/exco/businesses" className="underline-offset-2 hover:underline">
                Businesses
              </Link>
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
          </div>
          <StatusBadge intent={businessVerificationIntent(business.businessStatus)}>
            {business.verificationLabel}
          </StatusBadge>
        </div>

        <MetadataGroup>
          <MetadataItem label="Category">{business.industryName ?? "Not set"}</MetadataItem>
          <MetadataItem label="Location">{business.location ?? "Not set"}</MetadataItem>
          <MetadataItem label="Phone">{business.phone ?? "Not set"}</MetadataItem>
          <MetadataItem label="Email">{business.email ?? "Not set"}</MetadataItem>
          <MetadataItem label="Website">{business.websiteUrl ?? "Not set"}</MetadataItem>
          <MetadataItem label="CAC registered (member claim)">
            {business.cacRegistered === true
              ? "Yes (claim)"
              : business.cacRegistered === false
                ? "No"
                : "Not set"}
          </MetadataItem>
          <MetadataItem label="CAC number">{business.cacNumber ?? "Not set"}</MetadataItem>
          <MetadataItem label="Visibility">{business.visibilityStatus}</MetadataItem>
        </MetadataGroup>

        {business.description ? (
          <section>
            <h2 className="text-lg font-medium">Description / company profile</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {business.description}
            </p>
          </section>
        ) : null}

        {business.servicesOffered.length > 0 ? (
          <section>
            <h2 className="text-lg font-medium">Services</h2>
            <p className="mt-2 text-sm">{business.servicesOffered.join(", ")}</p>
          </section>
        ) : null}

        <section>
          <h2 className="text-lg font-medium">Associations</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {business.professionals.map((p) => (
              <li key={p.profileId} className="rounded-md border border-border p-3">
                <p className="font-medium">
                  {p.displayName} · {p.relationshipType}
                </p>
                <p className="text-muted-foreground">{p.email}</p>
                <p className="text-muted-foreground">
                  Professional verification: {p.professionalVerificationStatus} · Visibility:{" "}
                  {p.professionalVisibilityStatus}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-medium">Documents</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {business.documents.length === 0 ? <li>No documents.</li> : null}
            {business.documents.map((d) => (
              <li key={d.id}>
                {d.fileName} · {d.documentType} ·{" "}
                <Link
                  href={`/api/exco/documents/${d.id}/signed-url`}
                  className="underline-offset-2 hover:underline"
                >
                  Open (signed)
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {business.clarificationMessage ? (
          <Surface className="p-4 text-sm">
            <p className="font-medium">Current member-facing message</p>
            <p className="mt-1">{business.clarificationMessage}</p>
          </Surface>
        ) : null}

        <ExcoBusinessReviewActions
          businessId={id}
          businessStatus={business.businessStatus}
          verificationLabel={business.verificationLabel}
          canVerify={canVerify}
        />
      </div>
    </ProductExcoShell>
  );
}
