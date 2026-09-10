"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Field, FormSection, Textarea } from "@/components/ui";
import { createOpportunityAction } from "@/features/opportunities/actions";
import {
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  OPPORTUNITY_TYPES,
  OPPORTUNITY_TYPE_LABELS,
  type EmploymentTypeValue,
  type OpportunityTypeValue,
} from "@/features/opportunities/schema";

export function CreateOpportunityForm() {
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [type, setType] = React.useState<OpportunityTypeValue>("COLLABORATION");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [requiredProfession, setRequiredProfession] = React.useState("");
  const [minYears, setMinYears] = React.useState("");
  const [employmentType, setEmploymentType] = React.useState<"" | EmploymentTypeValue>("");
  const [requiredSkills, setRequiredSkills] = React.useState("");

  React.useEffect(() => {
    setHydrated(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hydrated || busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await createOpportunityAction({
        type,
        title,
        description,
        locationPreference: location,
        requiredProfession,
        minYearsExperience: minYears,
        employmentType: employmentType || null,
        requiredSkills,
        // Forged claims must be ignored server-side.
        role: "EXCO_ADMIN",
        isAdmin: true,
        createdBy: "forged-user",
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSuccess("Opportunity created and open for member interest.");
      setTitle("");
      setDescription("");
      setLocation("");
      setRequiredProfession("");
      setMinYears("");
      setEmploymentType("");
      setRequiredSkills("");
      router.refresh();
    } catch {
      setError("Could not create opportunity.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} data-testid="create-opportunity-form">
      <FormSection
        title="Create opportunity"
        description="Post an opportunity for members to discover and express interest. Optional matching criteria are used only for EXCO potential-match review — not applications or messaging."
      >
        <div className="flex flex-col gap-4">
          <Field label="Type">
            <select
              id="create-opp-type"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={type}
              disabled={!hydrated || busy}
              onChange={(e) => setType(e.target.value as OpportunityTypeValue)}
            >
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {OPPORTUNITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title" required>
            <input
              id="create-opp-title"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={title}
              disabled={!hydrated || busy}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </Field>
          <Field label="Description" required>
            <Textarea
              id="create-opp-description"
              value={description}
              disabled={!hydrated || busy}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={5000}
              rows={5}
              required
            />
          </Field>
          <Field label="Location" optional>
            <input
              id="create-opp-location"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={location}
              disabled={!hydrated || busy}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
            />
          </Field>

          <p className="text-sm font-medium text-foreground">Matching criteria (optional)</p>
          <p className="text-xs text-muted-foreground">
            Deterministic rules only. Leave blank when a dimension should not participate. A potential
            match is not interest, application, or contact authorization.
          </p>
          <Field label="Required profession" optional>
            <input
              id="create-opp-profession"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={requiredProfession}
              disabled={!hydrated || busy}
              onChange={(e) => setRequiredProfession(e.target.value)}
              maxLength={200}
              placeholder="Exact match against professional profession"
            />
          </Field>
          <Field label="Minimum years of experience" optional>
            <input
              id="create-opp-min-years"
              type="number"
              min={0}
              max={80}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={minYears}
              disabled={!hydrated || busy}
              onChange={(e) => setMinYears(e.target.value)}
            />
          </Field>
          <Field label="Employment type" optional>
            <select
              id="create-opp-employment-type"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={employmentType}
              disabled={!hydrated || busy}
              onChange={(e) =>
                setEmploymentType(e.target.value as "" | EmploymentTypeValue)
              }
            >
              <option value="">Any / not required</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EMPLOYMENT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Required skills" optional>
            <input
              id="create-opp-skills"
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              value={requiredSkills}
              disabled={!hydrated || busy}
              onChange={(e) => setRequiredSkills(e.target.value)}
              maxLength={500}
              placeholder="Comma-separated; all listed skills required"
            />
          </Field>

          {error ? (
            <Alert intent="danger" title="Could not create">
              {error}
            </Alert>
          ) : null}
          {success ? (
            <Alert intent="success" title="Created" data-testid="create-opportunity-success">
              {success}
            </Alert>
          ) : null}

          <Button type="submit" disabled={!hydrated || busy} data-testid="create-opportunity-submit">
            {busy ? "Creating…" : "Create opportunity"}
          </Button>
        </div>
      </FormSection>
    </form>
  );
}
