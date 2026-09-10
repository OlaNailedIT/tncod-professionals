import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ContainerWidth = "narrow" | "standard" | "wide" | "full";

type ContainerProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  width?: ContainerWidth;
  children: ReactNode;
};

const widthClass: Record<ContainerWidth, string> = {
  narrow: "layout-container-narrow",
  standard: "layout-container-standard",
  wide: "layout-container-wide",
  full: "layout-container-full",
};

/** Constrained content region. Default: standard (960px). */
export function Container({
  as,
  width = "standard",
  className,
  children,
  ...props
}: ContainerProps) {
  const Comp = as ?? "div";
  return (
    <Comp className={cn("layout-container", widthClass[width], className)} {...props}>
      {children}
    </Comp>
  );
}
