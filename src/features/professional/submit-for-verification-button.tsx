"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/ui";
import { submitProfileAction } from "@/features/professional/actions";
import { memberMaySubmitVerification } from "@/features/professional/verification-status";
import type { VerificationStatus } from "@prisma/client";

export function SubmitForVerificationButton({
  completionPercent,
  verificationStatus,
}: {
  completionPercent: number;
  verificationStatus: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  const maySubmit =
    completionPercent === 100 &&
    memberMaySubmitVerification(verificationStatus as VerificationStatus);

  async function onSubmit() {
    if (!hydrated || busy || !maySubmit) return;
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      const result = await submitProfileAction();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  if (completionPercent < 100) {
    return null;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <Alert intent="danger" title="Could not submit">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert intent="success" title="Submitted for verification">
          Your profile is pending EXCO review. Completion, verification, and directory visibility
          remain separate.
        </Alert>
      ) : null}
      {maySubmit ? (
        <Button type="button" disabled={!hydrated || busy} onClick={onSubmit}>
          Submit for verification
        </Button>
      ) : verificationStatus === "PENDING" || verificationStatus === "UNDER_REVIEW" ? (
        <p className="text-sm text-muted-foreground">
          Your profile is already in the verification queue ({verificationStatus}).
        </p>
      ) : verificationStatus === "VERIFIED" ? (
        <p className="text-sm text-muted-foreground">
          Your professional verification is VERIFIED. Directory publication is a separate EXCO
          action.
        </p>
      ) : null}
    </div>
  );
}
