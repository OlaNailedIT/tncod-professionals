"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button } from "@/components/ui";
import { closeOpportunityAction } from "@/features/opportunities/actions";

export function CloseOpportunityButton({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  async function onClose() {
    if (!hydrated || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await closeOpportunityAction(opportunityId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } catch {
      setError("Could not close opportunity.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? (
        <Alert intent="danger" title="Could not close">
          {error}
        </Alert>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        disabled={!hydrated || busy}
        onClick={() => void onClose()}
        data-testid="close-opportunity"
      >
        Close opportunity
      </Button>
    </div>
  );
}
