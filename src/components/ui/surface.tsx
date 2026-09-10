import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Low-level surface plane (Phase 5.5).
 * Prefer Card when the region is a meaningful content boundary with structure.
 */
const surfaceVariants = cva("min-w-0 rounded-md", {
  variants: {
    tone: {
      default: "bg-surface text-foreground",
      muted: "bg-surface-muted text-foreground",
      subtle: "bg-surface-subtle text-foreground",
    },
    bordered: {
      true: "border border-border",
      false: "",
    },
    elevation: {
      none: "shadow-none",
      subtle: "shadow-subtle",
      default: "shadow-default",
    },
  },
  defaultVariants: {
    tone: "default",
    bordered: true,
    elevation: "none",
  },
});

export type SurfaceProps = HTMLAttributes<HTMLElement> &
  VariantProps<typeof surfaceVariants> & {
    as?: ElementType;
    children?: ReactNode;
  };

export function Surface({
  as,
  className,
  tone,
  bordered,
  elevation,
  children,
  ...props
}: SurfaceProps) {
  const Comp = as ?? "div";
  return (
    <Comp className={cn(surfaceVariants({ tone, bordered, elevation }), className)} {...props}>
      {children}
    </Comp>
  );
}

export { surfaceVariants };
