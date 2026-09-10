"use client";

import * as React from "react";
import { Alert, Button, FormSection } from "@/components/ui";
import { updateSpotlightInterestAction } from "@/features/spotlight/actions";

export function SpotlightInterestForm({ initialInterested }: { initialInterested: boolean }) {
  const [interested, setInterested] = React.useState(initialInterested);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    setInterested(initialInterested);
  }, [initialInterested]);

  async function onToggle(next: boolean) {
    if (!hydrated || busy) return;
    const previous = interested;
    setInterested(next);
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const result = await updateSpotlightInterestAction({ interested: next });
      if (!result.ok) {
        setInterested(previous);
        setError(result.message);
        return;
      }
      setMessage(next ? "Interest saved." : "Interest withdrawn.");
    } catch {
      setInterested(previous);
      setError("Could not update Spotlight interest. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormSection
      title="Spotlight interest"
      description="Express interest in being featured. This is not public visibility and is not legal consent."
    >
      <div className="flex flex-col gap-3" data-testid="spotlight-interest-form" data-hydrated={hydrated ? "true" : "false"}>
        <p id="spotlight-interest-help" className="text-sm text-muted-foreground">
          EXCO may consider you for Spotlight Monday preparation when your profile is complete,
          verified, and has a headshot. This does not publish your profile publicly.
        </p>
        <p className="text-sm font-medium text-foreground">
          Interested in being featured?{" "}
          <span data-testid="spotlight-interest-status">{interested ? "Yes" : "No"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!hydrated || busy || interested}
            onClick={() => void onToggle(true)}
            aria-describedby="spotlight-interest-help"
            data-testid="spotlight-interest-yes"
          >
            Yes - I am interested
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!hydrated || busy || !interested}
            onClick={() => void onToggle(false)}
            aria-describedby="spotlight-interest-help"
            data-testid="spotlight-interest-withdraw"
          >
            No - withdraw interest
          </Button>
        </div>

        {error ? (
          <Alert intent="danger" title="Could not save" data-testid="spotlight-interest-error">
            {error}
          </Alert>
        ) : null}
        {message ? (
          <Alert intent="success" title="Saved" data-testid="spotlight-interest-feedback">
            {message}
          </Alert>
        ) : null}
      </div>
    </FormSection>
  );
}
