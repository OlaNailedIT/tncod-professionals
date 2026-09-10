import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type GridColumns = 2 | 3 | 4;

type GridProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  columns?: GridColumns;
  children: ReactNode;
};

const columnsClass: Record<GridColumns, string> = {
  2: "layout-grid-2",
  3: "layout-grid-3",
  4: "layout-grid-4",
};

/**
 * Responsive grid: 1 col mobile → 2 tablet → up to N on desktop.
 * Not a 12-column framework.
 */
export function Grid({ as, columns = 2, className, children, ...props }: GridProps) {
  const Comp = as ?? "div";
  return (
    <Comp className={cn("layout-grid", columnsClass[columns], className)} {...props}>
      {children}
    </Comp>
  );
}
