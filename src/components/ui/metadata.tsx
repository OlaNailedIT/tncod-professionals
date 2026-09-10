import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Generic label/value metadata (Phase 5.6).
 * No domain field names — consumers supply label and value.
 */
export type MetadataItemProps = HTMLAttributes<HTMLDivElement> & {
  label: string;
  children: ReactNode;
};

export function MetadataItem({ label, className, children, ...props }: MetadataItemProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)} {...props}>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-body-sm text-foreground">{children}</dd>
    </div>
  );
}

export type MetadataGroupProps = HTMLAttributes<HTMLDListElement> & {
  children: ReactNode;
};

export function MetadataGroup({ className, children, ...props }: MetadataGroupProps) {
  return (
    <dl className={cn("grid gap-4 sm:grid-cols-2", className)} {...props}>
      {children}
    </dl>
  );
}
