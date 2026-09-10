import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Presentational badge only (Phase 5.5).
 * No verification / workflow / business-status semantics — that is Phase 5.6.
 */
const badgeVariants = cva(
  "inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-caption font-medium whitespace-normal break-words",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary-solid text-secondary-foreground",
        outline: "border border-border bg-surface text-foreground",
        muted: "bg-muted text-muted-foreground",
        accent: "bg-accent-muted text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "muted",
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
