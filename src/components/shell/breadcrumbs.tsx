import * as React from "react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
  /** Showcase: navigate without product routes. */
  onNavigate?: (href: string) => void;
};

/**
 * Lightweight orientation trail (Phase 5.10).
 * Use only where hierarchy helps (e.g. EXCO record). Not on every page.
 */
export function Breadcrumbs({ items, className, onNavigate }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("text-caption text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {last || !item.href ? (
                <span
                  className={cn(last && "font-medium text-foreground")}
                  aria-current={last ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : onNavigate ? (
                <button
                  type="button"
                  className="rounded-sm text-link underline-offset-2 hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => onNavigate(item.href!)}
                >
                  {item.label}
                </button>
              ) : (
                <a
                  href={item.href}
                  className="rounded-sm text-link underline-offset-2 hover:text-link-hover hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
