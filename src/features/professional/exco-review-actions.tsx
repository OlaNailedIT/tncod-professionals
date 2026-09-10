"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Dialog, Field, FormSection, Textarea, StatusBadge } from "@/components/ui";
import {
  excoProfessionalDecisionAction,
  publishProfileAction,
  unpublishProfileAction,
} from "@/features/professional/actions";
import {
  professionalVerificationIntent,
  type ExcoProfessionalAction,
} from "@/features/professional/verification-status";
import type { VerificationStatus, VisibilityStatus } from "@prisma/client";

export function ExcoProfessionalReviewActions({
  profileId,
  verificationStatus,
  verificationLabel,
  visibilityStatus,
  canVerify,
  canPublish,
}: {
  profileId: string;
  verificationStatus: VerificationStatus;
  verificationLabel: string;
  visibilityStatus: VisibilityStatus;
  canVerify: boolean;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [memberMessage, setMemberMessage] = React.useState("");
  const [internalNote, setInternalNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);
  const [confirmVerify, setConfirmVerify] = React.useState(false);
  const [confirmUnpublish, setConfirmUnpublish] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  async function run(action: ExcoProfessionalAction) {
    if (!hydrated || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await excoProfessionalDecisionAction({
        profileId,
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
      setConfirmVerify(false);
      if (action === "verify" || action === "reject") {
        router.push("/exco/verification");
        router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError("Decision failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runPublish() {
    if (!hydrated || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await publishProfileAction(profileId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } catch {
      setError("Publish failed.");
    } finally {
      setBusy(false);
    }
  }

  async function runUnpublish() {
    if (!hydrated || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await unpublishProfileAction(profileId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setConfirmUnpublish(false);
      router.refresh();
    } catch {
      setError("Unpublish failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {error ? (
        <Alert intent="danger" title="Action blocked">
          {error}
        </Alert>
      ) : null}

      {canVerify ? (
        <FormSection
          title="Professional verification decision"
          description="Privileged actions are audited. Members cannot self-verify. Visibility is not changed by verify/clarify/reject."
        >
          <div className="mb-3">
            <StatusBadge intent={professionalVerificationIntent(verificationStatus)}>
              {verificationLabel}
            </StatusBadge>
          </div>
          <Field
            label="Member-facing reason"
            description="Required for clarification or rejection. Shown to the member."
          >
            <Textarea
              value={memberMessage}
              onChange={(e) => setMemberMessage(e.target.value)}
              rows={3}
            />
          </Field>
          <Field label="Internal EXCO note" description="Not shown to the member.">
            <Textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              rows={2}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!hydrated || busy}
              onClick={() => run("start_review")}
            >
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
            <Button
              type="button"
              disabled={!hydrated || busy}
              onClick={() => setConfirmVerify(true)}
            >
              Verify professional
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!hydrated || busy}
              onClick={() => run("reject")}
            >
              Reject
            </Button>
          </div>
        </FormSection>
      ) : (
        <Alert intent="info" title="View only">
          You can review this record but lack professional.verify for decisions.
        </Alert>
      )}

      {canPublish ? (
        <FormSection
          title="Directory publication"
          description="Publication is separate from verification. Only VERIFIED professionals may be published. Unpublish never clears VERIFIED."
        >
          <p className="mb-3 text-sm text-muted-foreground">
            Current visibility: <strong>{visibilityStatus}</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={!hydrated || busy || verificationStatus !== "VERIFIED"}
              onClick={() => runPublish()}
            >
              Publish to directory
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!hydrated || busy || visibilityStatus !== "DIRECTORY"}
              onClick={() => setConfirmUnpublish(true)}
            >
              Unpublish
            </Button>
          </div>
        </FormSection>
      ) : null}

      <Dialog
        open={confirmVerify}
        onOpenChange={setConfirmVerify}
        title="Confirm verification"
        confirmLabel="Confirm verify"
        onConfirm={() => {
          void run("verify");
        }}
      >
        You are about to verify this professional. This marks the professional as verified. It does
        not publish them to the directory.
      </Dialog>

      <Dialog
        open={confirmUnpublish}
        onOpenChange={setConfirmUnpublish}
        title="Confirm unpublish"
        confirmLabel="Confirm unpublish"
        tone="destructive"
        onConfirm={() => {
          void runUnpublish();
        }}
      >
        This changes directory visibility from DIRECTORY to MEMBERS_ONLY. Verification status will
        not change.
      </Dialog>
    </div>
  );
}
