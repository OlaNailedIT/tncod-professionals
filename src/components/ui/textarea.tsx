"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { controlClassName } from "./control-styles";
import { useFieldContext } from "./field";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, id, disabled, required, readOnly, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const field = useFieldContext();
    const describedBy = [field?.describedBy, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

    return (
      <textarea
        ref={ref}
        id={id ?? field?.controlId}
        disabled={disabled ?? field?.disabled}
        required={required ?? field?.required}
        readOnly={readOnly}
        aria-invalid={field?.invalid || undefined}
        aria-required={(required ?? field?.required) || undefined}
        aria-describedby={describedBy}
        className={cn(controlClassName, "min-h-24 py-2", className)}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
