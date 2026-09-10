"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { controlClassName } from "./control-styles";
import { useFieldContext } from "./field";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

/**
 * Native select (Phase 5.7). No custom dropdown menu library.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, id, disabled, required, "aria-describedby": ariaDescribedBy, children, ...props }, ref) => {
    const field = useFieldContext();
    const describedBy = [field?.describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    return (
      <select
        ref={ref}
        id={id ?? field?.controlId}
        disabled={disabled ?? field?.disabled}
        required={required ?? field?.required}
        aria-invalid={field?.invalid || undefined}
        aria-required={(required ?? field?.required) || undefined}
        aria-describedby={describedBy}
        className={cn(controlClassName, "h-9 min-h-9 appearance-auto", className)}
        {...props}
      >
        {children}
      </select>
    );
  },
);
Select.displayName = "Select";
