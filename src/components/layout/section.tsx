import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionDensity = "member" | "exco";

type SectionProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  density?: SectionDensity;
  children: ReactNode;
};

const densityClass: Record<SectionDensity, string> = {
  member: "layout-section-member",
  exco: "layout-section-exco",
};

/** Section with Member/EXCO density gap. Same tokens — different composition. */
export function Section({
  as,
  density = "member",
  className,
  children,
  ...props
}: SectionProps) {
  const Comp = as ?? "section";
  return (
    <Comp className={cn("layout-section", densityClass[density], className)} {...props}>
      {children}
    </Comp>
  );
}
