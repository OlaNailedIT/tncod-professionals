import Image from "next/image";
import { cn } from "@/lib/utils";

/** Later Phase 23B owner-supplied mark. Preserve its bytes, colour and 204:192 ratio. */
export function ProfessionalsMark({
  size = 32,
  title = "",
}: {
  /** Display height only; width follows the original aspect ratio. */
  size?: number;
  title?: string;
}) {
  return (
    <Image
      src="/brand/professionals-mark.jpg"
      alt={title}
      width={204}
      height={192}
      style={{ height: size, width: "auto" }}
      className="shrink-0"
      unoptimized
    />
  );
}

export function ProfessionalsLogo({
  compact = false,
  alt = "TNCOD Professionals",
  className,
}: {
  compact?: boolean;
  alt?: string;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 items-center gap-2", className)}
      role={alt ? "img" : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
    >
      <ProfessionalsMark size={compact ? 32 : 40} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-caption text-muted-foreground">TNCOD</span>
        <span className="text-body-sm font-semibold text-foreground">Professionals</span>
      </span>
    </span>
  );
}
