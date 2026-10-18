import type { Metadata } from "next";
import Link from "next/link";
import { Section, Stack } from "@/components/layout";
import { PageIntro } from "@/components/guidance/page-intro";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Alert, Button, StatusBadge } from "@/components/ui";
import {
  DASHBOARD_SECONDARY_LINKS,
  resolveMemberNextAction,
} from "@/features/dashboard/next-action";
import { loadOwnMemberProfile } from "@/features/profile/own-profile";
import {
  presentProfileStatus,
  presentVerificationStatus,
  presentVisibilityStatus,
} from "@/lib/status";
import type { ProfileStatus, VerificationStatus, VisibilityStatus } from "@/types/status";
import { requireMemberPage } from "@/server/auth/require-member";

export const metadata: Metadata = {
  title: "Dashboard — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const identity = await requireMemberPage("/dashboard");
  const profile = await loadOwnMemberProfile(identity.userId);
  const next = resolveMemberNextAction(profile);

  return (
    <ProductMemberShell pathname="/dashboard" title="Dashboard">
      <Section density="member">
        <Stack gap="comfortable">
          <PageIntro
            title={`Welcome${profile?.displayName ? `, ${profile.displayName}` : ""}`}
            purpose="Manage your professional profile and explore opportunities within the TNCOD community."
            whatToDo="Signing in does not verify you or list you in the directory. Use the next step below — completion, verification, and directory listing stay separate."
          />

          {profile ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2" aria-label="Profile status summary">
                <StatusBadge
                  intent={presentProfileStatus(profile.profileStatus as ProfileStatus).intent}
                >
                  Profile: {presentProfileStatus(profile.profileStatus as ProfileStatus).label}
                </StatusBadge>
                <StatusBadge intent="neutral">
                  Completion: {profile.completion.percent}%
                </StatusBadge>
                <StatusBadge
                  intent={presentVerificationStatus(
                    profile.verificationStatus as VerificationStatus,
                  ).intent}
                >
                  Verification:{" "}
                  {presentVerificationStatus(profile.verificationStatus as VerificationStatus).label}
                </StatusBadge>
                <StatusBadge
                  intent={presentVisibilityStatus(profile.visibilityStatus as VisibilityStatus).intent}
                >
                  Directory:{" "}
                  {presentVisibilityStatus(profile.visibilityStatus as VisibilityStatus).label}
                </StatusBadge>
              </div>
            </div>
          ) : (
            <Alert intent="warning" title="Profile missing">
              Your account is signed in, but we could not find your profile. Contact support if this
              continues.
            </Alert>
          )}

          <div className="rounded-lg border border-border-subtle bg-surface px-4 py-5 sm:px-5">
            <h2 className="text-h3 text-foreground">{next.title}</h2>
            <p className="mt-2 max-w-2xl text-body-sm text-muted-foreground">{next.body}</p>
            <div className="mt-4">
              <Button asChild>
                <Link href={next.href}>{next.cta}</Link>
              </Button>
            </div>
          </div>

          <nav aria-label="Member shortcuts" className="flex flex-wrap gap-3">
            {DASHBOARD_SECONDARY_LINKS.map((link) => (
              <Button key={link.href} asChild variant="outline">
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
            <Button asChild variant="ghost">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
          </nav>
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
