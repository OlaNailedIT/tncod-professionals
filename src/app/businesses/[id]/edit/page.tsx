import { notFound } from "next/navigation";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { requireMemberPage } from "@/server/auth/require-member";
import { AppError } from "@/lib/errors";
import { listActiveIndustries } from "@/features/profile/own-profile";
import { loadOwnBusiness } from "@/features/business/own-business";
import { BusinessProfileForm } from "@/features/business/business-profile-form";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireMemberPage(`/businesses/${id}/edit`);
  const industries = await listActiveIndustries();

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
    <ProductMemberShell pathname="/businesses" title="Edit business">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit {business.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Profile edits do not change verification state or directory visibility.
          </p>
        </div>
        <BusinessProfileForm
          mode="edit"
          businessId={id}
          industries={industries}
          defaults={{
            name: business.name,
            industryId: business.industryId ?? "none",
            description: business.description ?? "",
            location: business.location ?? "",
            phone: business.phone ?? "",
            email: business.email ?? "",
            websiteUrl: business.websiteUrl ?? "",
            linkedin: business.socialLinks.linkedin ?? "",
            twitter: business.socialLinks.twitter ?? "",
            facebook: business.socialLinks.facebook ?? "",
            instagram: business.socialLinks.instagram ?? "",
            servicesOffered: business.servicesOfferedForm,
            relationshipType: business.relationshipType,
          }}
        />
      </div>
    </ProductMemberShell>
  );
}
