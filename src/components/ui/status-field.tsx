import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Dimension row: domain label + status presentation (Phase 5.6).
 * Keeps Profile / Verification / Directory visually independent.
 */
export type StatusFieldProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  children: ReactNode;
};

export function StatusField({ label, className, children, ...props }: StatusFieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)} {...props}>
      <span className="text-caption text-muted-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/**
 * Group of independent status dimensions.
 * Prefer ≤3 simultaneous badges in Member contexts; EXCO may show more when scanning.
 */
export function StatusGroup({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-wrap items-start gap-x-5 gap-y-3", className)}
      {...props}
    />
  );
}
