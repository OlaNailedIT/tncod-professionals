"use client";

import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui";
import { directoryQueryString, type DirectoryQuery } from "@/features/directory/query";

export function DirectoryFiltersForm({
  query,
  industries,
}: {
  query: DirectoryQuery;
  industries: string[];
}) {
  const router = useRouter();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next: DirectoryQuery = {
      q: String(fd.get("q") ?? "").trim(),
      profession: String(fd.get("profession") ?? "").trim(),
      industry: String(fd.get("industry") ?? "").trim(),
      location: String(fd.get("location") ?? "").trim(),
      service: String(fd.get("service") ?? "").trim(),
      page: 1,
    };
    router.push(`/professionals${directoryQueryString(next)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4"
      aria-label="Directory search and filters"
    >
      <Field label="Search">
        <Input
          name="q"
          defaultValue={query.q}
          placeholder="Name, profession, skill, service, or location"
          autoComplete="off"
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Profession">
          <Input name="profession" defaultValue={query.profession} autoComplete="off" />
        </Field>
        <Field label="Industry">
          <Select name="industry" defaultValue={query.industry}>
            <option value="">Any industry</option>
            {industries.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Location">
          <Input name="location" defaultValue={query.location} autoComplete="off" />
        </Field>
        <Field label="Service">
          <Input name="service" defaultValue={query.service} autoComplete="off" />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">Apply</Button>
        <Button type="button" variant="outline" onClick={() => router.push("/professionals")}>
          Clear
        </Button>
      </div>
    </form>
  );
}
