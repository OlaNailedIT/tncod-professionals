import Link from "next/link";
import { StatusBadge, Surface } from "@/components/ui";
import type { PublicProfessional } from "@/security/projections";

function summaryList(items: string[], limit = 4): string {
  if (items.length === 0) return "";
  const shown = items.slice(0, limit);
  const extra = items.length - shown.length;
  return extra > 0 ? `${shown.join(", ")} +${extra}` : shown.join(", ");
}

export function DirectoryProfessionalCard({ item }: { item: PublicProfessional }) {
  const subtitle = [item.profession, item.industryName, item.location].filter(Boolean).join(" · ");
  const skills = summaryList(item.skillNames);
  const services = summaryList(item.serviceNames);

  return (
    <Surface className="p-4 transition-colors hover:bg-muted/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/professionals/${encodeURIComponent(item.publicSlug)}`}
            className="text-base font-medium text-foreground underline-offset-2 hover:underline"
          >
            {item.displayName}
          </Link>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          {skills ? (
            <p className="mt-2 text-caption text-muted-foreground">Skills: {skills}</p>
          ) : null}
          {services ? (
            <p className="mt-1 text-caption text-muted-foreground">Services: {services}</p>
          ) : null}
        </div>
        {item.verifiedBadge ? (
          <StatusBadge intent="success" aria-label="Verified professional">
            Verified
          </StatusBadge>
        ) : null}
      </div>
    </Surface>
  );
}
