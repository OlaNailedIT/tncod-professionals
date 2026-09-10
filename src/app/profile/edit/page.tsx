import type { Metadata } from "next";
import { Section, Stack } from "@/components/layout";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { Alert } from "@/components/ui";
import { ProfileEditForm } from "@/features/profile/profile-edit-form";
import { listActiveIndustries, loadOwnMemberProfile } from "@/features/profile/own-profile";
import { requireMemberPage } from "@/server/auth/require-member";

export const metadata: Metadata = {
  title: "Edit profile — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default async function ProfileEditPage() {
  const identity = await requireMemberPage("/profile/edit");
  const [profile, industries] = await Promise.all([
    loadOwnMemberProfile(identity.userId),
    listActiveIndustries(),
  ]);

  const businessSummary =
    profile && profile.businessLinks.length > 0
      ? profile.businessLinks
          .map((b) => {
            const detail = [b.relationshipType, b.industryName].filter(Boolean).join(" · ");
            return detail ? `${b.name} (${detail})` : b.name;
          })
          .join("; ")
      : null;

  return (
    <ProductMemberShell pathname="/profile/edit" title="Edit profile">
      <Section density="member">
        <Stack gap="comfortable">
          <div>
            <h1 className="text-h1 text-foreground">Edit your profile</h1>
            <p className="mt-3 layout-prose text-body text-muted-foreground">
              You can update your own details. Email stays tied to your secure sign-in identity. Saving here does not
              verify or publish you.
            </p>
          </div>

          {!profile ? (
            <Alert intent="warning" title="Profile missing">
              We could not load your professional record for editing.
            </Alert>
          ) : (
            <ProfileEditForm
              industries={industries}
              defaults={{
                displayName: profile.displayName,
                phone: profile.phone ?? "",
                location: profile.location ?? "",
                bio: profile.bio ?? "",
                professionalSituation: profile.professionalSituation ?? "",
                profession: profile.profession ?? "",
                organisation: profile.organisationName ?? "",
                industryId: profile.industryId ?? "",
                yearsExperience:
                  profile.yearsExperience != null ? String(profile.yearsExperience) : "",
                skills: profile.skillNames.join(", "),
                services: profile.serviceNames.join(", "),
                linkedinUrl: profile.linkedinUrl ?? "",
                serviceArea: profile.serviceArea ?? "",
                lookingFor: profile.lookingForSummary ?? "",
                offering: profile.offeringSummary ?? "",
                opportunityPreferences: profile.opportunityPreferences,
                businessApplicable: profile.completion.businessApplicable,
                businessSummary,
              }}
            />
          )}
        </Stack>
      </Section>
    </ProductMemberShell>
  );
}
