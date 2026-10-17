import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PageIntroProps = {
  title: string;
  purpose: string;
  /** Optional calm guidance — what to do on this page */
  whatToDo?: string;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
};

/**
 * Phase 23D — page orientation block.
 * Answers: where am I / why am I here / what should I do.
 * Low visual weight; not a second design system.
 */
export function PageIntro({
  title,
  purpose,
  whatToDo,
  children,
  className,
  actions,
}: PageIntroProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-4", className)}>
      <div className="min-w-0 max-w-2xl">
        <h1 className="text-h1 text-foreground">{title}</h1>
        <p className="mt-2 layout-prose text-body text-muted-foreground">{purpose}</p>
        {whatToDo ? (
          <p className="mt-3 text-body-sm text-foreground">{whatToDo}</p>
        ) : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
