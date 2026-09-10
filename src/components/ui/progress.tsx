import * as React from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Determinate progress bar (Phase 5.8).
 * Use Spinner for indeterminate waits.
 */
export type ProgressProps = HTMLAttributes<HTMLDivElement> & {
  value: number;
  max?: number;
  label?: string;
};

export function Progress({
  className,
  value,
  max = 100,
  label = "Progress",
  ...props
}: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max === 0 ? 0 : Math.round((clamped / max) * 100);

  return (
    <div className={cn("w-full min-w-0", className)} {...props}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-caption text-muted-foreground">{label}</span>
        <span className="text-caption text-muted-foreground">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-label={label}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
