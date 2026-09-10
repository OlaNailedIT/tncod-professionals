"use client";

import * as React from "react";
import Link from "next/link";
import {
  Alert,
  Button,
  FormActions,
  FormSection,
  Radio,
  RadioGroup,
} from "@/components/ui";
import { Stack } from "@/components/layout";
import {
  UX_PREFERENCE_HELP,
  UX_PREFERENCE_LABELS,
  type VisibilityGroupKey,
  type VisibilityPreferenceLevelValue,
} from "@/features/visibility/groups";
import { upsertVisibilityPreferenceAction } from "@/features/visibility/actions";
import type { VisibilityPreferenceRow } from "@/features/visibility/own-preferences";

type Props = {
  initial: VisibilityPreferenceRow[];
  directoryListed: boolean;
  systemNotes: readonly string[];
};

export function PrivacyPreferencesForm({ initial, directoryListed, systemNotes }: Props) {
  const [rows, setRows] = React.useState(initial);
  const [busyKey, setBusyKey] = React.useState<VisibilityGroupKey | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRows(initial);
  }, [initial]);

  async function onChange(groupKey: VisibilityGroupKey, preference: VisibilityPreferenceLevelValue) {
    setBusyKey(groupKey);
    setError(null);
    setMessage(null);
    try {
      const result = await upsertVisibilityPreferenceAction({ groupKey, preference });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setRows(result.preferences.preferences);
      setMessage("Visibility preference saved.");
    } catch {
      setError("Could not save that visibility preference. Please try again.");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <Stack gap="comfortable">
      <Alert intent="neutral" title="How visibility works">
        These settings express where you are comfortable sharing information. Choosing Public
        directory does not guarantee public display — your profile must be verified and published,
        and the directory only shows information it is allowed to show. Preferences never override
        platform security rules.
      </Alert>

      {directoryListed ? (
        <Alert intent="info" title="Listed in the public directory">
          While your profile is published, Identity must stay set to Public directory so your listing
          has a usable name.
        </Alert>
      ) : null}

      {error ? (
        <Alert intent="danger" title="Could not save">
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert intent="success" title="Saved">
          {message}
        </Alert>
      ) : null}

      {rows.map((row) => (
        <FormSection
          key={row.groupKey}
          title={row.label}
          description={row.description}
          data-group={row.groupKey}
          data-testid={`visibility-group-${row.groupKey}`}
        >
          {row.lockedReason ? (
            <p className="text-body-sm text-muted-foreground">{row.lockedReason}</p>
          ) : null}
          <RadioGroup
            name={`pref-${row.groupKey}`}
            aria-label={`${row.label} visibility`}
          >
            {row.allowedLevels.map((level) => (
              <Radio
                key={level}
                value={level}
                label={`${UX_PREFERENCE_LABELS[level]} — ${UX_PREFERENCE_HELP[level]}`}
                checked={row.preference === level}
                disabled={!row.editable || busyKey === row.groupKey}
                onChange={() => {
                  void onChange(row.groupKey, level);
                }}
              />
            ))}
          </RadioGroup>
          {!row.editable && row.control === "fixed_private" ? (
            <p className="text-body-sm text-muted-foreground">
              Current setting: {UX_PREFERENCE_LABELS[row.preference]} (not changeable)
            </p>
          ) : null}
        </FormSection>
      ))}

      <FormSection
        title="Controlled by the platform"
        description="These are not visibility preferences. They cannot be changed here."
      >
        <ul className="list-disc space-y-1 pl-5 text-body-sm text-muted-foreground">
          {systemNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </FormSection>

      <FormActions>
        <Button asChild variant="secondary">
          <Link href="/settings">Back to settings</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/profile">View profile</Link>
        </Button>
      </FormActions>
    </Stack>
  );
}
