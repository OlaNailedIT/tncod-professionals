"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type FieldContextValue = {
  controlId: string;
  descriptionId?: string;
  errorId?: string;
  describedBy?: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);

export function useFieldContext() {
  return React.useContext(FieldContext);
}

export type FieldProps = {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  optional?: boolean;
  className?: string;
  /** Inline layout for checkbox/radio rows */
  layout?: "stack" | "inline";
};

/**
 * Accessible field composition (Phase 5.7).
 * Convention: required fields show a visible asterisk + aria-required.
 * Optional fields may show “(optional)” when `optional` is set.
 */
export function Field({
  label,
  children,
  description,
  error,
  required = false,
  disabled = false,
  optional = false,
  className,
  layout = "stack",
}: FieldProps) {
  const reactId = React.useId();
  const controlId = `field-${reactId}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  const ctx: FieldContextValue = {
    controlId,
    descriptionId,
    errorId,
    describedBy,
    invalid: Boolean(error),
    required,
    disabled,
  };

  return (
    <FieldContext.Provider value={ctx}>
      <div
        className={cn(
          layout === "stack" ? "flex flex-col gap-1.5" : "flex items-start gap-3",
          className,
        )}
        data-invalid={error ? "true" : undefined}
      >
        {layout === "stack" ? (
          <>
            <label htmlFor={controlId} className="text-label text-foreground">
              {label}
              {required ? (
                <span className="text-danger" aria-hidden="true">
                  {" "}
                  *
                </span>
              ) : null}
              {optional && !required ? (
                <span className="ml-1 text-caption font-normal text-muted-foreground">(optional)</span>
              ) : null}
            </label>
            {children}
            {description ? (
              <p id={descriptionId} className="text-caption text-muted-foreground">
                {description}
              </p>
            ) : null}
            {error ? (
              <p id={errorId} className="text-caption text-danger" role="alert">
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="pt-0.5">{children}</div>
            <div className="flex min-w-0 flex-col gap-1">
              <label htmlFor={controlId} className="text-label text-foreground">
                {label}
                {required ? (
                  <span className="text-danger" aria-hidden="true">
                    {" "}
                    *
                  </span>
                ) : null}
                {optional && !required ? (
                  <span className="ml-1 text-caption font-normal text-muted-foreground">
                    (optional)
                  </span>
                ) : null}
              </label>
              {description ? (
                <p id={descriptionId} className="text-caption text-muted-foreground">
                  {description}
                </p>
              ) : null}
              {error ? (
                <p id={errorId} className="text-caption text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </>
        )}
      </div>
    </FieldContext.Provider>
  );
}
