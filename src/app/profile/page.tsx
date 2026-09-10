import type { Metadata } from "next";
import Link from "next/link";
import { Section, Stack } from "@/components/layout";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Alert, Button } from "@/components/ui";
import { loadOwnMemberProfile } from "@/features/profile/own-profile";
import { ProfileCompletionOverview } from "@/features/profile/profile-completion-overview";
import { requireMemberPage } from "@/server/auth/require-member";

export const metadata: Metadata = {
  title: "Your profile — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const identity = await requireMemberPage("/profile");
  const profile = await loadOwnMemberProfile(identity.userId);

  return (
    <ProductMemberShell pathname="/profile" title="Profile">
      <Section density="member">
        <Stack gap="comfortable">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-h1 text-foreground">Your profile</h1>
              <p className="mt-3 layout-prose text-body text-muted-foreground">
                Only you can see this private view. Completion is not verification or publication.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/profile/edit">Edit</Link>
            </Button>
          </div>

          {!profile ? (
            <Alert intent="warning" title="Profile missing">
              We could not load your professional record.
            </Alert>
          ) : (
            <ProfileCompletionOverview profile={profile} />
          )}
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
