import { notFound } from "next/navigation";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { requireMemberPage } from "@/server/auth/require-member";
import { AppError } from "@/lib/errors";
import { loadOwnBusiness } from "@/features/business/own-business";
import { listBusinessDocumentsForMember } from "@/features/business/business-documents";
import { BusinessVerificationForm } from "@/features/business/business-verification-form";

export default async function BusinessVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireMemberPage(`/businesses/${id}/verification`);

  let business;
  let documents;
  try {
    business = await loadOwnBusiness(user.userId, id);
    documents = await listBusinessDocumentsForMember(user.userId, id);
  } catch (err) {
    if (err instanceof AppError && (err.code === "NOT_FOUND" || err.code === "UNAUTHORIZED")) {
      notFound();
    }
    throw err;
  }

  return (
    <ProductMemberShell pathname="/businesses" title="Business verification">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Verify {business.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit evidence for EXCO review. Company profile details come from your business
            profile fields.
          </p>
        </div>
        <BusinessVerificationForm
          businessId={id}
          businessStatus={business.businessStatus}
          verificationLabel={business.verificationLabel}
          clarificationMessage={business.clarificationMessage}
          cacRegistered={business.cacRegistered}
          cacNumber={business.cacNumber}
          documents={documents}
        />
      </div>
    </ProductMemberShell>
  );
}
