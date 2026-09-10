import * as React from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Indeterminate loading indicator (Phase 5.8).
 * Respects prefers-reduced-motion.
 */
export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  label?: string;
  size?: "sm" | "md";
};

export function Spinner({
  className,
  label = "Loading",
  size = "md",
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-2 text-muted-foreground", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block rounded-full border-2 border-border border-t-primary",
          size === "sm" ? "size-3.5" : "size-5",
          "motion-safe:animate-spin",
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
