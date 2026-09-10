"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, StatusBadge } from "@/components/ui";
import {
  archiveSpotlightAction,
  createSpotlightAction,
  publishSpotlightAction,
  restoreSpotlightAction,
} from "@/features/spotlight/actions";
import type { SpotlightCandidate } from "@/features/spotlight/commands";
import type { SpotlightRecordProjection } from "@/features/spotlight/projection";

function EligibilityChecks({
  eligibility,
}: {
  eligibility: SpotlightCandidate["professional"]["eligibility"];
}) {
  const items = [
    { ok: eligibility.interest, label: "Spotlight interest" },
    { ok: eligibility.profileComplete, label: "Profile complete" },
    { ok: eligibility.headshotAvailable, label: "Headshot available" },
    { ok: eligibility.verified, label: "Verified" },
  ];
  return (
    <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="Eligibility">
      {items.map((item) => (
        <li key={item.label}>
          <span aria-hidden="true">{item.ok ? "✓" : "✗"} </span>
          <span className={item.ok ? "text-foreground" : undefined}>
            {item.label}
            <span className="sr-only">{item.ok ? " met" : " not met"}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SpotlightCandidatesPanel({
  candidates,
  canManage,
}: {
  candidates: SpotlightCandidate[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  async function onCreate(profileId: string) {
    if (!canManage || !hydrated || busyId) return;
    setBusyId(profileId);
    setError(null);
    setSuccess(null);
    try {
      const result = await createSpotlightAction({
        profileId,
        // Forged claims must be ignored server-side.
        verified: true,
        profileComplete: true,
        headshotAvailable: true,
        spotlightInterest: true,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess("Spotlight created as draft.");
      router.refresh();
    } catch {
      setError("Could not create Spotlight.");
    } finally {
      setBusyId(null);
    }
  }

  if (candidates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No professionals currently meet all Spotlight requirements (interest, 100% completion,
        headshot, and verified). Headshot upload remains a separate prerequisite.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <Alert intent="danger" title="Action failed">
          {error}
        </Alert>
      ) : null}
      {success ? (
        <Alert intent="success" title="Success">
          {success}
        </Alert>
      ) : null}
      <ul className="flex flex-col gap-3">
        {candidates.map((c) => {
          const p = c.professional;
          return (
            <li key={p.profileId} className="rounded-md border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-medium text-foreground">{p.displayName}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {[p.profession, p.industryName].filter(Boolean).join(" · ") || "Professional"}
                  </p>
                  <EligibilityChecks eligibility={p.eligibility} />
                  {c.alreadySpotlighted ? (
                    <p className="mt-2 text-sm text-foreground">
                      Already spotlighted
                      {c.activeSpotlightStatus ? ` (${c.activeSpotlightStatus})` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge intent={p.hasHeadshot ? "success" : "neutral"}>
                    {p.hasHeadshot ? "Headshot" : "No headshot"}
                  </StatusBadge>
                  {canManage && !c.alreadySpotlighted ? (
                    <Button
                      type="button"
                      disabled={!hydrated || busyId === p.profileId}
                      onClick={() => void onCreate(p.profileId)}
                      data-testid={`spotlight-create-${p.profileId}`}
                    >
                      {busyId === p.profileId ? "Creating…" : "Create Spotlight"}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ExistingSpotlightsPanel({
  spotlights,
  canManage,
}: {
  spotlights: SpotlightRecordProjection[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(
    spotlightId: string,
    action: "publish" | "archive" | "restore",
  ) {
    if (!canManage || busyId) return;
    setBusyId(spotlightId);
    setError(null);
    try {
      const result =
        action === "publish"
          ? await publishSpotlightAction(spotlightId)
          : action === "archive"
            ? await archiveSpotlightAction(spotlightId)
            : await restoreSpotlightAction(spotlightId);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.refresh();
    } catch {
      setError("Spotlight action failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (spotlights.length === 0) {
    return <p className="text-sm text-muted-foreground">No Spotlights yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <Alert intent="danger" title="Action failed">
          {error}
        </Alert>
      ) : null}
      <ul className="flex flex-col gap-3">
        {spotlights.map((s) => (
          <li key={s.id} className="rounded-md border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground">
                  {s.professional.displayName}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {[s.professional.profession, s.professional.industryName]
                    .filter(Boolean)
                    .join(" · ") || "Professional"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Status: {s.status}
                  {!s.currentlyEligible && s.status !== "ARCHIVED"
                    ? " · currently ineligible"
                    : null}
                  {!s.currentlyEligible && s.status === "ARCHIVED"
                    ? " · archived (ineligible or manual)"
                    : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge intent={s.currentlyEligible ? "success" : "warning"}>
                  {s.currentlyEligible ? "Eligible" : "Ineligible"}
                </StatusBadge>
                {canManage && s.status === "DRAFT" ? (
                  <Button
                    type="button"
                    disabled={busyId === s.id}
                    onClick={() => void run(s.id, "publish")}
                  >
                    Publish (ops)
                  </Button>
                ) : null}
                {canManage && s.status !== "ARCHIVED" ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyId === s.id}
                    onClick={() => void run(s.id, "archive")}
                  >
                    Archive
                  </Button>
                ) : null}
                {canManage && s.status === "ARCHIVED" && s.currentlyEligible ? (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busyId === s.id}
                    onClick={() => void run(s.id, "restore")}
                  >
                    Restore to draft
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
