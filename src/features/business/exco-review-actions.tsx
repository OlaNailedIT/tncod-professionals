"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, FormSection, Textarea, StatusBadge } from "@/components/ui";
import { excoBusinessDecisionAction } from "@/features/business/actions";
import {
  businessVerificationIntent,
  type ExcoBusinessAction,
} from "@/features/business/verification-status";
import type { BusinessStatus } from "@prisma/client";

export function ExcoBusinessReviewActions({
  businessId,
  businessStatus,
  verificationLabel,
  canVerify,
}: {
  businessId: string;
  businessStatus: BusinessStatus;
  verificationLabel: string;
  canVerify: boolean;
}) {
  const router = useRouter();
  const [memberMessage, setMemberMessage] = React.useState("");
  const [internalNote, setInternalNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  async function run(action: ExcoBusinessAction) {
    if (!hydrated || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await excoBusinessDecisionAction({
        businessId,
        action,
        memberFacingMessage: memberMessage,
        internalNote,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setMemberMessage("");
      setInternalNote("");
      router.refresh();
    } catch {
      setError("Decision failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!canVerify) {
    return (
      <Alert intent="info" title="View only">
        You can review this submission but lack business.verify permission for decisions.
      </Alert>
    );
  }

  return (
    <FormSection title="Verification decision" description="Privileged actions are audited. Members cannot self-verify.">
      <div className="mb-3">
        <StatusBadge intent={businessVerificationIntent(businessStatus)}>
          {verificationLabel}
        </StatusBadge>
      </div>
      {error ? (
        <Alert intent="danger" title="Action blocked">
          {error}
        </Alert>
      ) : null}
      <Field
        label="Member-facing reason"
        description="Shown to the member for clarification or rejection. Keep constructive."
      >
        <Textarea value={memberMessage} onChange={(e) => setMemberMessage(e.target.value)} rows={3} />
      </Field>
      <Field label="Internal EXCO note" description="Not shown to the member.">
        <Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={!hydrated || busy} onClick={() => run("start_review")}>
          Start review
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!hydrated || busy}
          onClick={() => run("request_clarification")}
        >
          Request clarification
        </Button>
        <Button type="button" disabled={!hydrated || busy} onClick={() => run("approve")}>
          Verify business
        </Button>
        <Button type="button" variant="destructive" disabled={!hydrated || busy} onClick={() => run("reject")}>
          Reject
        </Button>
      </div>
    </FormSection>
  );
}
