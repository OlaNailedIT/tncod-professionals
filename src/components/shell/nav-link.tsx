import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { isNavActive } from "./is-nav-active";

export type ShellLinkMode = "link" | "button";

export type NavLinkProps = {
  href: string;
  label: string;
  pathname: string;
  /** Showcase mode uses buttons so product routes are not hit. */
  mode?: ShellLinkMode;
  onNavigate?: (href: string) => void;
  className?: string;
  density?: "member" | "exco";
  /** Optional ARIA role (e.g. menuitem inside AccountMenu). */
  role?: string;
};

/**
 * Presentational navigation item with accessible current state.
 * Active ≠ focus; colour reinforces, not sole meaning (aria-current + weight).
 */
export function NavLink({
  href,
  label,
  pathname,
  mode = "link",
  onNavigate,
  className,
  density = "member",
  role,
}: NavLinkProps) {
  const active = isNavActive(pathname, href);
  const classes = cn(
    "block w-full rounded-md text-left transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset",
    density === "exco" ? "px-3 py-1.5 text-body-sm" : "px-3 py-2 text-label",
    active
      ? "bg-surface-muted font-medium text-foreground"
      : "font-normal text-muted-foreground hover:bg-surface-muted hover:text-foreground",
    className,
  );

  if (mode === "button" || onNavigate) {
    return (
      <button
        type="button"
        role={role}
        className={classes}
        aria-current={active ? "page" : undefined}
        onClick={() => onNavigate?.(href)}
      >
        {label}
      </button>
    );
  }

  return (
    <Link
      href={href}
      role={role}
      className={classes}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
