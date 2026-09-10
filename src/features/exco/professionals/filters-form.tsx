"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui";
import {
  type ExcoProfessionalsQuery,
  excoProfessionalsQueryString,
} from "@/features/exco/professionals/query";
import { VERIFICATION_STATUS_LABELS, VISIBILITY_STATUS_LABELS } from "@/lib/status/presentations";

export function ExcoProfessionalsFiltersForm({
  query,
  industries,
}: {
  query: ExcoProfessionalsQuery;
  industries: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const next: ExcoProfessionalsQuery = {
      q: String(fd.get("q") ?? "").trim(),
      verificationStatus: String(fd.get("verification") ?? "").trim(),
      visibilityStatus: String(fd.get("visibility") ?? "").trim(),
      completion: (() => {
        const c = String(fd.get("completion") ?? "");
        return c === "complete" || c === "incomplete" ? c : "";
      })(),
      profession: String(fd.get("profession") ?? "").trim(),
      industryId: String(fd.get("industryId") ?? "").trim(),
      location: String(fd.get("location") ?? "").trim(),
      businessOwner: fd.get("businessOwner") === "on",
      jobSeeker: fd.get("jobSeeker") === "on",
      verifiedProfessional: fd.get("verified") === "on",
      sort: (String(fd.get("sort") ?? "display_name_asc") as ExcoProfessionalsQuery["sort"]) ||
        "display_name_asc",
      page: 1,
    };
    router.push(`/exco/professionals${excoProfessionalsQueryString(next)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
      noValidate
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Search">
          <Input name="q" defaultValue={query.q} placeholder="Name, profession, location…" />
        </Field>
        <Field label="Profession (contains)">
          <Input name="profession" defaultValue={query.profession} />
        </Field>
        <Field label="Location">
          <Input name="location" defaultValue={query.location} />
        </Field>
        <Field label="Professional verification">
          <Select name="verification" defaultValue={query.verificationStatus || ""}>
            <option value="">Any</option>
            {Object.entries(VERIFICATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Directory visibility">
          <Select name="visibility" defaultValue={query.visibilityStatus || ""}>
            <option value="">Any</option>
            {Object.entries(VISIBILITY_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Profile completion">
          <Select name="completion" defaultValue={query.completion || ""}>
            <option value="">Any</option>
            <option value="complete">Complete (100%)</option>
            <option value="incomplete">Incomplete (&lt; 100%)</option>
          </Select>
        </Field>
        <Field label="Industry">
          <Select name="industryId" defaultValue={query.industryId || ""}>
            <option value="">Any</option>
            {industries.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Sort">
          <Select name="sort" defaultValue={query.sort}>
            <option value="display_name_asc">Name A–Z</option>
            <option value="display_name_desc">Name Z–A</option>
            <option value="created_at_desc">Newest registration</option>
            <option value="created_at_asc">Oldest registration</option>
            <option value="updated_at_desc">Recently updated</option>
            <option value="updated_at_asc">Least recently updated</option>
            <option value="verification_status_asc">Verification (asc)</option>
            <option value="verification_status_desc">Verification (desc)</option>
          </Select>
        </Field>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="businessOwner" defaultChecked={query.businessOwner} />
          Business owner (OWNER only)
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="jobSeeker" defaultChecked={query.jobSeeker} />
          Job seeker
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="verified" defaultChecked={query.verifiedProfessional} />
          Verified professional
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!hydrated}>
          Apply filters
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!hydrated}
          onClick={() => router.push("/exco/professionals")}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
