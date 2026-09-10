"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const RadioGroupContext = React.createContext<{ name: string } | null>(null);

export type RadioGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  name: string;
};

export function RadioGroup({ className, name, children, ...props }: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ name }}>
      <div role="radiogroup" className={cn("flex flex-col gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export type RadioProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, id, label, disabled, name, ...props }, ref) => {
    const group = React.useContext(RadioGroupContext);
    const reactId = React.useId();
    const inputId = id ?? `radio-${reactId}`;

    return (
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex min-h-9 items-center gap-2 text-body-sm text-foreground",
          disabled && "opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          id={inputId}
          type="radio"
          name={name ?? group?.name}
          disabled={disabled}
          className={cn(
            "size-4 shrink-0 border-input accent-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset",
            "disabled:cursor-not-allowed",
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  },
);
Radio.displayName = "Radio";
