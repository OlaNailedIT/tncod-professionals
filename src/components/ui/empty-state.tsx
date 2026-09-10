import * as React from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Absence-of-content composition (Phase 5.8).
 * Not an error. Generic — no product-specific empty screens.
 */
export type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ className, title, children, action, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-start gap-3 rounded-md border border-dashed border-border bg-surface px-5 py-8",
        className,
      )}
      {...props}
    >
      <h3 className="text-h4 text-foreground">{title}</h3>
      {children ? <div className="layout-prose text-body-sm text-muted-foreground">{children}</div> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
