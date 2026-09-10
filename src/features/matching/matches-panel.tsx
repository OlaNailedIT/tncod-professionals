import { StatusBadge, Surface } from "@/components/ui";
import type { FindMatchesResult } from "@/features/matching/commands";
import type { DimensionResult } from "@/features/matching/rules";

function dimensionLabel(key: string): string {
  switch (key) {
    case "profession":
      return "Profession";
    case "location":
      return "Location";
    case "experience":
      return "Experience";
    case "workType":
      return "Work type";
    case "skills":
      return "Skills";
    case "availability":
      return "Availability";
    default:
      return key;
  }
}

function DimensionRow({ dim }: { dim: DimensionResult }) {
  const intent =
    dim.status === "MATCH"
      ? "success"
      : dim.status === "NO_MATCH"
        ? "danger"
        : dim.status === "INSUFFICIENT_DATA"
          ? "warning"
          : "neutral";
  return (
    <li className="flex flex-wrap items-baseline gap-2 text-xs">
      <span className="min-w-[5.5rem] font-medium text-foreground">{dimensionLabel(dim.key)}</span>
      <StatusBadge intent={intent}>{dim.status.replaceAll("_", " ")}</StatusBadge>
      <span className="text-muted-foreground">{dim.detail}</span>
    </li>
  );
}

/**
 * EXCO-only potential matches panel. Not a recommendation feed.
 * A potential match ≠ interest, application, or contact authorization.
 */
export function PotentialMatchesPanel({ result }: { result: FindMatchesResult }) {
  if (!result.ok) {
    return (
      <Surface className="p-5" data-testid="potential-matches-panel">
        <h2 className="text-h3 text-foreground">Potential matches</h2>
        <p className="mt-2 text-sm text-muted-foreground" data-testid="matches-error">
          {result.message}
        </p>
      </Surface>
    );
  }

  return (
    <Surface className="p-5" data-testid="potential-matches-panel">
      <h2 className="text-h3 text-foreground">Potential matches</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Deterministic structured criteria only. A potential match does not mean the professional
        applied, expressed interest, or may be contacted.
      </p>

      {!result.criteriaConfigured ? (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="matches-no-criteria">
          There is not enough structured information to perform a complete match. Add optional
          matching criteria when creating an opportunity.
        </p>
      ) : result.matches.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="matches-empty">
          No professionals currently satisfy the structured matching criteria among verified active
          members
          {result.insufficientCount > 0
            ? ` (${result.insufficientCount} had insufficient structured data for a complete evaluation)`
            : ""}
          .
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4" data-testid="matches-list">
          {result.matches.map((m) => (
            <li
              key={m.profileId}
              className="rounded-md border border-border p-4"
              data-testid="match-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-foreground">{m.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {[m.profession, m.location, m.yearsExperience != null ? `${m.yearsExperience} yrs` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  {m.skillNames.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Skills: {m.skillNames.join(", ")}
                    </p>
                  ) : null}
                </div>
                <StatusBadge intent="success">Potential match</StatusBadge>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5" aria-label="Match dimensions">
                {m.dimensions.map((d) => (
                  <DimensionRow key={d.key} dim={d} />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {result.criteriaConfigured ? (
        <p className="mt-4 text-xs text-muted-foreground" data-testid="matches-meta">
          Evaluated {result.evaluatedCount} verified professionals · {result.matches.length} potential
          match{result.matches.length === 1 ? "" : "es"}
        </p>
      ) : null}
    </Surface>
  );
}
