import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageFrameProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
};

/** Full-width page frame with responsive gutters. Application chrome is Phase 5.10. */
export function PageFrame({ as, className, children, ...props }: PageFrameProps) {
  const Comp = as ?? "div";
  return (
    <Comp className={cn("layout-page", className)} {...props}>
      {children}
    </Comp>
  );
}
