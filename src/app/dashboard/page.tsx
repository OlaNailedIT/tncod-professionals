import type { Metadata } from "next";
import Link from "next/link";
import { Section, Stack } from "@/components/layout";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Alert, Button, StatusBadge } from "@/components/ui";
import { loadOwnMemberProfile } from "@/features/profile/own-profile";
import { requireMemberPage } from "@/server/auth/require-member";

export const metadata: Metadata = {
  title: "Dashboard — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const identity = await requireMemberPage("/dashboard");
  const profile = await loadOwnMemberProfile(identity.userId);

  return (
    <ProductMemberShell pathname="/dashboard" title="Dashboard">
      <Section density="member">
        <Stack gap="comfortable">
          <div>
            <h1 className="text-h1 text-foreground">
              Welcome{profile?.displayName ? `, ${profile.displayName}` : ""}
            </h1>
            <p className="mt-3 layout-prose text-body text-muted-foreground">
              You are signed in. This is your private member area — signing in does not verify you
              or list you in the public directory.
            </p>
          </div>

          {profile ? (
            <div className="flex flex-wrap gap-2" aria-label="Profile status summary">
              <StatusBadge intent="info">Profile: {profile.profileStatus}</StatusBadge>
              <StatusBadge intent="neutral">Verification: {profile.verificationStatus}</StatusBadge>
              <StatusBadge intent="neutral">Directory: {profile.visibilityStatus}</StatusBadge>
            </div>
          ) : (
            <Alert intent="warning" title="Profile missing">
              Your account is signed in, but a professional profile record was not found. Contact
              support if this continues.
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/profile">View your profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          </div>
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
