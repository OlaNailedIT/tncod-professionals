import type { Metadata } from "next";
import Link from "next/link";
import { Section, Stack } from "@/components/layout";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Alert, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { requireMemberPage } from "@/server/auth/require-member";
import { getOwnSpotlightInterest } from "@/features/spotlight/own-interest";
import { SpotlightInterestForm } from "@/features/spotlight/spotlight-interest-form";

export const metadata: Metadata = {
  title: "Settings — TNCOD Professionals",
  robots: { index: false, follow: false },
};

/** Auth-gated settings hub. Privacy & visibility is Phase 14. Spotlight interest is Phase 15. */
export default async function SettingsPage() {
  const user = await requireMemberPage("/settings");
  const spotlightInterest = await getOwnSpotlightInterest(user.userId);
  return (
    <ProductMemberShell pathname="/settings" title="Settings">
      <Section density="member">
        <Stack gap="comfortable">
          <h1 className="text-h1 text-foreground">Settings</h1>
          <Card>
            <CardHeader>
              <CardTitle>Privacy & visibility</CardTitle>
              <CardDescription>
                Control where applicable profile information may be shown. Preferences never override
                platform directory rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/settings/privacy">Open privacy settings</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Spotlight</CardTitle>
              <CardDescription>
                Interest in being featured is separate from privacy preferences and does not publish
                your profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SpotlightInterestForm initialInterested={spotlightInterest} />
            </CardContent>
          </Card>
          <Alert intent="neutral" title="Account">
            Use Account → Sign out when you are finished. Other account settings are not part of this
            phase.
          </Alert>
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
