"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useFieldContext } from "./field";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, disabled, required, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const field = useFieldContext();
    const describedBy = [field?.describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    return (
      <input
        ref={ref}
        type="checkbox"
        id={id ?? field?.controlId}
        disabled={disabled ?? field?.disabled}
        required={required ?? field?.required}
        aria-invalid={field?.invalid || undefined}
        aria-required={(required ?? field?.required) || undefined}
        aria-describedby={describedBy}
        className={cn(
          "size-4 shrink-0 rounded-sm border border-input text-primary accent-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Checkbox.displayName = "Checkbox";
