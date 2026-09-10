"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

/**
 * Platform Button (Phase 5.5 + loading state in Phase 5.8).
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-md text-label transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset",
    "disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        secondary: "bg-secondary-solid text-secondary-foreground hover:bg-secondary-hover",
        outline: "border border-border bg-surface text-foreground hover:bg-surface-muted",
        ghost: "text-foreground hover:bg-surface-muted",
        destructive: "bg-danger text-danger-foreground hover:opacity-90",
        link: "text-link underline-offset-4 hover:text-link-hover hover:underline",
      },
      size: {
        default: "h-9 min-h-9 px-4 py-2",
        sm: "h-8 min-h-8 px-3",
        lg: "h-10 min-h-10 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Processing state — prevents duplicate activation; keeps dimensions. */
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref,
  ) => {
    // Loading requires a real button (Spinner + label); asChild is ignored while loading.
    const Comp = asChild && !loading ? Slot : "button";
    const isDisabled = disabled || loading;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={Comp === "button" ? isDisabled : undefined}
        aria-disabled={Comp !== "button" ? isDisabled || undefined : undefined}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" label="Processing" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
