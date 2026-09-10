import * as React from "react";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Layout-preserving loading placeholder (Phase 5.8).
 */
export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-md bg-surface-muted",
        "motion-safe:animate-pulse",
        className,
      )}
      {...props}
    />
  );
}
