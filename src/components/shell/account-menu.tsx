"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NavItem } from "./nav-config";
import { NavLink, type ShellLinkMode } from "./nav-link";

export type AccountMenuProps = {
  items: NavItem[];
  pathname: string;
  mode?: ShellLinkMode;
  onNavigate?: (href: string) => void;
  label?: string;
  className?: string;
};

/**
 * Presentational account control (Phase 5.10 + a11y remediation in 5.12).
 * No Auth, sessions, or role queries.
 */
export function AccountMenu({
  items,
  pathname,
  mode = "button",
  onNavigate,
  label = "Account",
  className,
}: AccountMenuProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const menuId = React.useId();

  const close = React.useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    }
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    const firstItem = rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        ref={triggerRef}
        type="button"
        size="sm"
        variant="outline"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(true) : setOpen(true))}
      >
        {label}
      </Button>
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          className="absolute right-0 z-40 mt-2 min-w-44 rounded-md border border-border bg-surface p-1 shadow-default"
        >
          {items.map((item) => (
            <div key={item.href} role="none">
              {item.href === "/auth/sign-out" ? (
                <a
                  href="/auth/sign-out"
                  role="menuitem"
                  className="block w-full rounded-md px-3 py-2 text-left text-label font-normal text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset"
                >
                  {item.label}
                </a>
              ) : (
                <NavLink
                  href={item.href}
                  label={item.label}
                  pathname={pathname}
                  mode={mode}
                  role="menuitem"
                  className="w-full"
                  onNavigate={
                    mode === "button" || onNavigate
                      ? (href) => {
                          onNavigate?.(href);
                          close(true);
                        }
                      : undefined
                  }
                />
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
