import * as React from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { StatusIntent } from "@/lib/status";

/**
 * Persistent feedback notice (Phase 5.8).
 * Text carries meaning; colour reinforces. Not a domain StatusBadge.
 */
const alertVariants = cva("rounded-md border px-4 py-3 text-body-sm", {
  variants: {
    intent: {
      neutral: "border-border bg-surface-muted text-foreground",
      info: "border-transparent bg-info-muted text-info",
      success: "border-transparent bg-success-muted text-success",
      warning: "border-transparent bg-warning-muted text-warning",
      danger: "border-transparent bg-danger-muted text-danger",
    },
  },
  defaultVariants: {
    intent: "neutral",
  },
});

export type AlertProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    intent?: StatusIntent;
    title?: string;
    children: ReactNode;
    /** Use alert for urgent dynamic errors; status for static notices. */
    role?: "status" | "alert";
  };

export function Alert({
  className,
  intent = "neutral",
  title,
  children,
  role = "status",
  ...props
}: AlertProps) {
  return (
    <div
      role={role}
      className={cn(alertVariants({ intent }), className)}
      {...props}
    >
      {title ? <p className="text-label text-inherit">{title}</p> : null}
      <div className={cn(title && "mt-1", "text-inherit")}>{children}</div>
    </div>
  );
}

export { alertVariants };
