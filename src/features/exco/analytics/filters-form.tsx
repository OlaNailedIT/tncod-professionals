"use client";

import { useRouter } from "next/navigation";
import { PROFESSIONAL_SITUATIONS } from "@/features/registration/schema";
import {
  analyticsQueryString,
  type AnalyticsQuery,
} from "@/features/exco/analytics/query";

const VERIFICATION_OPTIONS = [
  { value: "", label: "All verification states" },
  { value: "NOT_REVIEWED", label: "Not reviewed" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "NEEDS_CLARIFICATION", label: "Needs clarification" },
  { value: "REJECTED", label: "Rejected" },
] as const;

export function AnalyticsFiltersForm({
  query,
  industryOptions,
}: {
  query: AnalyticsQuery;
  industryOptions: string[];
}) {
  const router = useRouter();

  function onChange(next: Partial<AnalyticsQuery>) {
    const merged: AnalyticsQuery = {
      situation: next.situation === undefined ? query.situation : next.situation,
      industry: next.industry === undefined ? query.industry : next.industry,
      verification:
        next.verification === undefined ? query.verification : next.verification,
      directoryEffective:
        next.directoryEffective === undefined
          ? query.directoryEffective
          : next.directoryEffective,
      registrationDays:
        next.registrationDays === undefined
          ? query.registrationDays
          : next.registrationDays,
    };
    router.push(`/exco/analytics${analyticsQueryString(merged)}`);
  }

  return (
    <form
      className="grid gap-3 rounded-md border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3"
      onSubmit={(e) => e.preventDefault()}
      aria-label="Analytics filters"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Professional situation</span>
        <select
          className="rounded-md border border-border bg-background px-2 py-1.5"
          value={query.situation ?? ""}
          onChange={(e) =>
            onChange({ situation: e.target.value ? e.target.value : null })
          }
        >
          <option value="">All situations</option>
          {PROFESSIONAL_SITUATIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Industry</span>
        <select
          className="rounded-md border border-border bg-background px-2 py-1.5"
          value={query.industry ?? ""}
          onChange={(e) =>
            onChange({ industry: e.target.value ? e.target.value : null })
          }
        >
          <option value="">All industries</option>
          {industryOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Professional verification</span>
        <select
          className="rounded-md border border-border bg-background px-2 py-1.5"
          value={query.verification ?? ""}
          onChange={(e) =>
            onChange({
              verification: e.target.value
                ? (e.target.value as AnalyticsQuery["verification"])
                : null,
            })
          }
        >
          {VERIFICATION_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Directory publication</span>
        <select
          className="rounded-md border border-border bg-background px-2 py-1.5"
          value={query.directoryEffective ?? ""}
          onChange={(e) =>
            onChange({
              directoryEffective:
                e.target.value === "published" || e.target.value === "not_published"
                  ? e.target.value
                  : null,
            })
          }
        >
          <option value="">All publication states</option>
          <option value="published">Effectively published</option>
          <option value="not_published">Not published</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">New registrations window</span>
        <select
          className="rounded-md border border-border bg-background px-2 py-1.5"
          value={String(query.registrationDays)}
          onChange={(e) => onChange({ registrationDays: Number(e.target.value) })}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </label>

      <div className="flex items-end">
        <button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          onClick={() => router.push("/exco/analytics")}
        >
          Clear filters
        </button>
      </div>
    </form>
  );
}
