import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StackGap = "tight" | "standard" | "comfortable" | "section";

type StackProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  gap?: StackGap;
  children: ReactNode;
};

const gapClass: Record<StackGap, string> = {
  tight: "layout-stack-tight",
  standard: "layout-stack-standard",
  comfortable: "layout-stack-comfortable",
  section: "layout-stack-section",
};

/** Vertical stack with parent-level gap (Phase 5.2 spacing). */
export function Stack({ as, gap = "standard", className, children, ...props }: StackProps) {
  const Comp = as ?? "div";
  return (
    <Comp className={cn("layout-stack", gapClass[gap], className)} {...props}>
      {children}
    </Comp>
  );
}
