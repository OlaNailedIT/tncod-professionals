import Link from "next/link";
import { Surface } from "@/components/ui";
import type { InterestRosterResult } from "@/features/opportunities/interest-roster";

function formatExpressedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Current interest only. Separate from the deterministic potential-match panel.
 * Contact stays on the linked professional record.
 */
export function InterestRosterPanel({ result }: { result: InterestRosterResult }) {
  if (!result.ok) {
    return (
      <Surface className="p-5" data-testid="interest-roster">
        <h2 className="text-h3 text-foreground">Expressed interest</h2>
        <p className="mt-2 text-sm text-muted-foreground">{result.message}</p>
      </Surface>
    );
  }

  const closed = result.opportunityStatus !== "ACTIVE";

  return (
    <Surface className="p-5" data-testid="interest-roster">
      <h2 className="text-h3 text-foreground">Expressed interest</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Members who currently have an interest record. This is not a potential match, an
        application, or permission to message them from this page.
      </p>
      {closed ? (
        <p className="mt-3 text-sm text-muted-foreground" data-testid="interest-roster-closed">
          This opportunity is {result.opportunityStatus.toLowerCase()}. The names below still have
          a current interest record. New interest is not accepted.
        </p>
      ) : null}
      {result.items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground" data-testid="interest-roster-empty">
          No members currently have an expressed interest.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3" data-testid="interest-roster-list">
          {result.items.map((item) => (
            <li key={item.professionalHref} className="flex flex-col gap-1">
              <Link href={item.professionalHref} className="font-medium text-foreground hover:underline">
                {item.displayName}
              </Link>
              <time className="text-sm text-muted-foreground" dateTime={item.expressedAt}>
                Expressed interest {formatExpressedAt(item.expressedAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
