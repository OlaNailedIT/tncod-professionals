import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Button, MetadataGroup, MetadataItem, StatusBadge, Surface } from "@/components/ui";
import { requireMemberPage } from "@/server/auth/require-member";
import { AppError } from "@/lib/errors";
import { loadOwnBusiness } from "@/features/business/own-business";
import { businessVerificationIntent } from "@/features/business/verification-status";

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireMemberPage(`/businesses/${id}`);

  let business;
  try {
    business = await loadOwnBusiness(user.userId, id);
  } catch (err) {
    if (err instanceof AppError && (err.code === "NOT_FOUND" || err.code === "UNAUTHORIZED")) {
      notFound();
    }
    throw err;
  }

  return (
    <ProductMemberShell pathname="/businesses" title={business.name}>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Relationship: {business.relationshipType}
            </p>
          </div>
          <StatusBadge intent={businessVerificationIntent(business.businessStatus)}>
            {business.verificationLabel}
          </StatusBadge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href={`/businesses/${id}/edit`}>Edit</Link>
          </Button>
          <Button asChild>
            <Link href={`/businesses/${id}/verification`}>Verification</Link>
          </Button>
        </div>

        {business.clarificationMessage ? (
          <Surface className="border border-warning/30 bg-warning-muted p-4 text-sm">
            <p className="font-medium">Action needed</p>
            <p className="mt-1">{business.clarificationMessage}</p>
          </Surface>
        ) : null}

        <MetadataGroup>
          <MetadataItem label="Category">{business.industryName ?? "Not set"}</MetadataItem>
          <MetadataItem label="Location">{business.location ?? "Not set"}</MetadataItem>
          <MetadataItem label="Phone">{business.phone ?? "Not set"}</MetadataItem>
          <MetadataItem label="Email">{business.email ?? "Not set"}</MetadataItem>
          <MetadataItem label="Website">{business.websiteUrl ?? "Not set"}</MetadataItem>
          <MetadataItem label="Directory visibility">{business.visibilityStatus}</MetadataItem>
        </MetadataGroup>

        {business.description ? (
          <section>
            <h2 className="text-lg font-medium">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {business.description}
            </p>
          </section>
        ) : null}

        {business.servicesOffered.length > 0 ? (
          <section>
            <h2 className="text-lg font-medium">Services</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {business.servicesOffered.join(", ")}
            </p>
          </section>
        ) : null}
      </div>
    </ProductMemberShell>
  );
}
