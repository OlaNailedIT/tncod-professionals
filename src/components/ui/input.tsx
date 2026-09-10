"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { controlClassName } from "./control-styles";
import { useFieldContext } from "./field";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, disabled, required, readOnly, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const field = useFieldContext();
    const describedBy = [field?.describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    return (
      <input
        ref={ref}
        id={id ?? field?.controlId}
        disabled={disabled ?? field?.disabled}
        required={required ?? field?.required}
        readOnly={readOnly}
        aria-invalid={field?.invalid || undefined}
        aria-required={(required ?? field?.required) || undefined}
        aria-describedby={describedBy}
        className={cn(controlClassName, "h-9 min-h-9", className)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
