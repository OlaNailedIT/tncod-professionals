"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/ui";
import {
  expressInterestAction,
  removeInterestAction,
} from "@/features/opportunities/actions";

export function InterestControls({
  opportunityId,
  initiallyInterested,
  acceptsInterest,
}: {
  opportunityId: string;
  initiallyInterested: boolean;
  acceptsInterest: boolean;
}) {
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);
  const [interested, setInterested] = React.useState(initiallyInterested);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    setInterested(initiallyInterested);
  }, [initiallyInterested]);

  async function onExpress() {
    if (!hydrated || busy || !acceptsInterest) return;
    const previous = interested;
    setInterested(true);
    setBusy(true);
    setError(null);
    try {
      const result = await expressInterestAction({
        opportunityId,
      });
      if (!result.ok) {
        setInterested(previous);
        setError(result.message);
        return;
      }
      router.refresh();
    } catch {
      setInterested(previous);
      setError("Could not record interest. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onWithdraw() {
    if (!hydrated || busy) return;
    const previous = interested;
    setInterested(false);
    setBusy(true);
    setError(null);
    try {
      const result = await removeInterestAction({
        opportunityId,
      });
      if (!result.ok) {
        setInterested(previous);
        setError(result.message);
        return;
      }
      router.refresh();
    } catch {
      setInterested(previous);
      setError("Could not update interest. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!acceptsInterest && !interested) {
    return (
      <p className="text-sm text-muted-foreground">This opportunity is no longer accepting interest.</p>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid={`interest-controls-${opportunityId}`}>
      {error ? (
        <Alert intent="danger" title="Could not update">
          {error}
        </Alert>
      ) : null}
      {interested ? (
        <>
          <p className="text-sm font-medium text-foreground" data-testid="interest-state">
            Interested
          </p>
          <Button
            type="button"
            variant="secondary"
            disabled={!hydrated || busy}
            onClick={() => void onWithdraw()}
          >
            Withdraw interest
          </Button>
        </>
      ) : (
        <Button
          type="button"
          disabled={!hydrated || busy || !acceptsInterest}
          onClick={() => void onExpress()}
          data-testid="express-interest"
        >
          I&apos;m interested
        </Button>
      )}
    </div>
  );
}
