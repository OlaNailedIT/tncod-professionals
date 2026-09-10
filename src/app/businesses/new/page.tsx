import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { requireMemberPage } from "@/server/auth/require-member";
import { listActiveIndustries } from "@/features/profile/own-profile";
import { BusinessProfileForm } from "@/features/business/business-profile-form";

export default async function NewBusinessPage() {
  await requireMemberPage("/businesses/new");
  const industries = await listActiveIndustries();

  return (
    <ProductMemberShell pathname="/businesses" title="Add business">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add a business</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Creating a business does not verify it, publish it, or change your professional
            verification status.
          </p>
        </div>
        <BusinessProfileForm mode="create" industries={industries} />
      </div>
    </ProductMemberShell>
  );
}
