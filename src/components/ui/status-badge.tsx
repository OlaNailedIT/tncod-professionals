import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";
import type { StatusIntent } from "@/lib/status";

/**
 * Semantic status chip (Phase 5.6).
 * Reuses Badge. Does not know about profiles/businesses/DB rows.
 * Meaning must appear in text (`children`); colour only reinforces intent.
 */
const intentClass: Record<StatusIntent, string> = {
  neutral: "",
  info: "border-transparent bg-info-muted text-info",
  success: "border-transparent bg-success-muted text-success",
  warning: "border-transparent bg-warning-muted text-warning",
  danger: "border-transparent bg-danger-muted text-danger",
};

export type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  intent?: StatusIntent;
};

export function StatusBadge({
  intent = "neutral",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <Badge
      variant={intent === "neutral" ? "muted" : "outline"}
      className={cn(intentClass[intent], className)}
      {...props}
    >
      {children}
    </Badge>
  );
}
