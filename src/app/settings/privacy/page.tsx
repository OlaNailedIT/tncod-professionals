import type { Metadata } from "next";
import { Section, Stack } from "@/components/layout";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { requireMemberPage } from "@/server/auth/require-member";
import { getMyVisibilityPreferences } from "@/features/visibility/own-preferences";
import { PrivacyPreferencesForm } from "@/features/visibility/privacy-preferences-form";

export const metadata: Metadata = {
  title: "Privacy & visibility — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function PrivacySettingsPage() {
  const user = await requireMemberPage("/settings/privacy");
  const view = await getMyVisibilityPreferences(user.userId);

  return (
    <ProductMemberShell pathname="/settings" title="Privacy & visibility">
      <Section density="member">
        <Stack gap="comfortable">
          <div>
            <h1 className="text-h1 text-foreground">Privacy & visibility</h1>
            <p className="mt-2 max-w-2xl text-body text-muted-foreground">
              Choose where applicable information may be shown. This is not a legal consent form,
              and it does not replace verification or directory publication decisions.
            </p>
          </div>
          <PrivacyPreferencesForm
            initial={view.preferences}
            directoryListed={view.visibilityStatus === "DIRECTORY"}
            systemNotes={view.systemControlledNotes}
          />
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
