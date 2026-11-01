"use client";

import * as React from "react";
import { Alert, Button } from "@/components/ui";
import { submitProfileAction } from "@/features/professional/actions";
import { memberMaySubmitVerification } from "@/features/professional/verification-status";
import { presentVerificationStatus } from "@/lib/status";
import type { VerificationStatus } from "@prisma/client";

class SubmissionBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <Alert intent="danger" role="alert" title="Submission could not be confirmed">
          Check your connection, then refresh your profile to check its status before trying again.
          <p className="mt-2">
            {/* A full navigation resets this boundary and reads the authoritative status. */}
            <a href="/profile" className="underline">Refresh profile</a>
          </p>
        </Alert>
      );
    }
    return this.props.children;
  }
}

export function SubmitForVerificationButton({
  completionPercent,
  verificationStatus,
}: {
  completionPercent: number;
  verificationStatus: string;
}) {
  return (
    <SubmissionBoundary>
      <SubmissionForm completionPercent={completionPercent} verificationStatus={verificationStatus} />
    </SubmissionBoundary>
  );
}

function SubmissionForm({ completionPercent, verificationStatus }: {
  completionPercent: number;
  verificationStatus: string;
}) {
  const [result, formAction, busy] = React.useActionState(submitProfileAction, null, "/profile");

  const maySubmit =
    completionPercent === 100 &&
    memberMaySubmitVerification(verificationStatus as VerificationStatus);

  if (completionPercent < 100) {
    return null;
  }

  return (
    <form action={formAction} className="space-y-3">
      {result && !result.ok ? (
        <Alert intent="danger" role="alert" title="Could not submit">
          {result.message}
        </Alert>
      ) : null}
      {result?.ok ? (
        <Alert intent="success" title="Submitted for verification">
          Your profile is pending EXCO review. Completion, verification, and directory visibility
          remain separate.
        </Alert>
      ) : null}
      {maySubmit ? (
        <Button type="submit" loading={busy}>
          {busy ? "Submitting…" : "Submit for verification"}
        </Button>
      ) : verificationStatus === "PENDING" || verificationStatus === "UNDER_REVIEW" ? (
        <p className="text-sm text-muted-foreground">
          Your profile is already in the verification queue ({presentVerificationStatus(verificationStatus as VerificationStatus).label}).
        </p>
      ) : verificationStatus === "VERIFIED" ? (
        <p className="text-sm text-muted-foreground">
          Your professional verification is complete. Directory publication is a separate EXCO
          action.
        </p>
      ) : null}
    </form>
  );
}
