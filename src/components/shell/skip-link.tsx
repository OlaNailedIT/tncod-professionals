import * as React from "react";
import { cn } from "@/lib/utils";

/** Keyboard-first skip link into main content (Phase 5.10). */
export function SkipLink({
  href = "#main-content",
  className,
  children = "Skip to content",
}: {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "absolute left-4 top-4 z-50 -translate-y-[200%] rounded-md bg-primary px-4 py-2 text-label text-primary-foreground",
        "opacity-0 transition-[transform,opacity] focus:translate-y-0 focus:opacity-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset",
        "motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </a>
  );
}
