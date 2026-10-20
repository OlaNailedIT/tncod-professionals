import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Progress,
  StatusBadge,
  Alert,
} from "@/components/ui";
import type { OwnMemberProfile } from "@/features/profile/own-profile";
import { SubmitForVerificationButton } from "@/features/professional/submit-for-verification-button";
import {
  presentProfileStatus,
  presentVerificationStatus,
  presentVisibilityStatus,
} from "@/lib/status";
import type { ProfileStatus, VerificationStatus, VisibilityStatus } from "@/types/status";

function sectionStateLabel(completed: number, total: number): string {
  if (total === 0) return "Not started";
  if (completed >= total) return "Complete";
  return `${completed} of ${total} completed`;
}

function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-border-subtle py-2.5 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-body text-foreground">{value?.trim() ? value : "Not added yet"}</dd>
    </div>
  );
}

export function ProfileCompletionOverview({ profile }: { profile: OwnMemberProfile }) {
  const { completion } = profile;
  const percent = completion.percent;
  const progressLabel = `Profile ${percent}% complete`;
  const profileState = presentProfileStatus(profile.profileStatus as ProfileStatus);
  const verificationState = presentVerificationStatus(profile.verificationStatus as VerificationStatus);
  const visibilityState = presentVisibilityStatus(profile.visibilityStatus as VisibilityStatus);

  let intro: string;
  let cta: string | null = "Complete profile";
  if (percent >= 100) {
    intro =
      "Your profile information looks complete. Completion does not mean verified or published — those remain separate.";
    cta = null;
  } else if (percent < 35) {
    intro =
      "Let's build your professional profile. A few details will help people understand who you are and how you can connect.";
  } else {
    intro =
      "Complete your profile to help other professionals understand who you are, what you do, and how you can connect.";
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-h3">{progressLabel}</CardTitle>
          <CardDescription>{intro}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={percent} max={100} label={progressLabel} />
          <div className="flex flex-wrap gap-2" aria-label="Independent status fields">
            <StatusBadge intent={profileState.intent}>Profile: {profileState.label}</StatusBadge>
            <StatusBadge intent={verificationState.intent}>
              Professional verification: {verificationState.label}
            </StatusBadge>
            <StatusBadge intent={visibilityState.intent}>Directory visibility: {visibilityState.label}</StatusBadge>
          </div>
          {profile.clarificationMessage &&
          (profile.verificationStatus === "NEEDS_CLARIFICATION" ||
            profile.verificationStatus === "REJECTED") ? (
            <Alert
              intent={profile.verificationStatus === "REJECTED" ? "danger" : "warning"}
              title={
                profile.verificationStatus === "REJECTED"
                  ? "Verification rejected"
                  : "Clarification requested"
              }
            >
              {profile.clarificationMessage}
            </Alert>
          ) : null}
          <dl className="min-w-0 text-body-sm text-muted-foreground">
            <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-1">
              <dt className="shrink-0">Sign-in email</dt>
              <dd className="min-w-0 break-all text-foreground">{profile.email}</dd>
            </div>
          </dl>
          <p className="text-caption text-muted-foreground">
            Completion is informational. It does not verify your profile or change directory visibility.
          </p>
        </CardContent>
        {cta ? (
          <CardFooter>
            <Button asChild>
              <Link href="/profile/edit">{cta}</Link>
            </Button>
          </CardFooter>
        ) : (
          <CardFooter className="flex flex-col items-stretch gap-4 sm:items-start">
            <Button asChild variant="outline">
              <Link href="/profile/edit">Edit profile</Link>
            </Button>
            <SubmitForVerificationButton
              completionPercent={percent}
              verificationStatus={profile.verificationStatus}
            />
          </CardFooter>
        )}
      </Card>

      {completion.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>{section.title}</CardTitle>
                <CardDescription>{sectionStateLabel(section.completedCount, section.totalCount)}</CardDescription>
              </div>
              <StatusBadge intent={section.completedCount >= section.totalCount ? "success" : "neutral"}>
                {section.completedCount >= section.totalCount ? "Complete" : "In progress"}
              </StatusBadge>
            </div>
          </CardHeader>
          <CardContent>
            <dl>
              {section.fields.map((field) => (
                <FieldRow key={field.key} label={field.label} value={field.displayValue} />
              ))}
              {section.id === "about" ? (
                <FieldRow
                  label="Headshot"
                  value={
                    profile.hasHeadshot
                      ? "Added — changes are not available yet"
                      : "Uploads are not available yet"
                  }
                />
              ) : null}
            </dl>
            {section.id === "business" ? (
              <p className="mt-3 text-caption text-muted-foreground">
                Business details come from linked business relationships.{" "}
                <Link href="/businesses" className="underline-offset-2 hover:underline">
                  Manage businesses
                </Link>
                . Business verification is separate from your profile completion.
              </p>
            ) : null}
            {section.id === "about" ? (
              <p className="mt-3 text-caption text-muted-foreground">
                You do not need a headshot to complete your profile. Uploads are not available yet.
              </p>
            ) : null}
            {section.id === "community" ? (
              <p className="mt-3 text-caption text-muted-foreground">
                Add your church team or department under Areas of service.
              </p>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline" size="sm">
              <Link href="/profile/edit">Edit</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
