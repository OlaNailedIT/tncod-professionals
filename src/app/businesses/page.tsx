import Link from "next/link";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Button, EmptyState, StatusBadge, Surface } from "@/components/ui";
import { requireMemberPage } from "@/server/auth/require-member";
import { listOwnBusinesses } from "@/features/business/own-business";
import { businessVerificationIntent } from "@/features/business/verification-status";

export default async function BusinessesPage() {
  const user = await requireMemberPage("/businesses");
  const businesses = await listOwnBusinesses(user.userId);

  return (
    <ProductMemberShell pathname="/businesses" title="Businesses">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your businesses</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Create and manage businesses you are associated with. Verification is separate from
              professional verification and directory publication.
            </p>
          </div>
          <Button asChild>
            <Link href="/businesses/new">Add business</Link>
          </Button>
        </div>

        {businesses.length === 0 ? (
          <EmptyState
            title="No businesses yet"
            action={
              <Button asChild>
                <Link href="/businesses/new">Add business</Link>
              </Button>
            }
          >
            If you own, operate, or represent a business, you can add it here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3">
            {businesses.map((b) => (
              <li key={b.id}>
                <Surface className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link href={`/businesses/${b.id}`} className="font-medium underline-offset-2 hover:underline">
                      {b.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {b.relationshipType}
                      {b.industryName ? ` · ${b.industryName}` : ""}
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
    </ProductMemberShell>
  );
}
