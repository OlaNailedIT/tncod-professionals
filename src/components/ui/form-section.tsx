import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Stack, type StackGap } from "@/components/layout/stack";

/**
 * Form section grouping (Phase 5.7). Uses Stack gaps from Phase 5.4.
 */
export type FormSectionProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  gap?: StackGap;
  children: ReactNode;
};

export function FormSection({
  title,
  description,
  gap = "standard",
  className,
  children,
  ...props
}: FormSectionProps) {
  return (
    <section className={cn("min-w-0", className)} {...props}>
      {(title || description) && (
        <div className="mb-3">
          {title ? <h3 className="text-h4 text-foreground">{title}</h3> : null}
          {description ? (
            <p className="mt-1 text-body-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      )}
      <Stack gap={gap}>{children}</Stack>
    </section>
  );
}

export type FormActionsProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function FormActions({ className, children, ...props }: FormActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 pt-2", className)} {...props}>
      {children}
    </div>
  );
}
