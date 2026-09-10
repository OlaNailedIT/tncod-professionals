"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { NavItem } from "./nav-config";
import { NavLink, type ShellLinkMode } from "./nav-link";

export type NavigationDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  items: NavItem[];
  pathname: string;
  mode?: ShellLinkMode;
  onNavigate?: (href: string) => void;
  density?: "member" | "exco";
  footer?: React.ReactNode;
};

/**
 * Mobile navigation drawer using native dialog (Phase 5.10).
 * Reuses Phase 5.8 dialog modality patterns — not a second modal system.
 */
export function NavigationDrawer({
  open,
  onOpenChange,
  title,
  items,
  pathname,
  mode = "button",
  onNavigate,
  density = "member",
  footer,
}: NavigationDrawerProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open) {
      if (!node.open) node.showModal();
    } else if (node.open) {
      node.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "m-0 ml-auto h-full max-h-none w-[min(100%,20rem)] max-w-full border-0 border-l border-border bg-surface p-0 text-foreground shadow-overlay",
        "backdrop:bg-foreground/40",
        "open:flex open:flex-col",
      )}
      onClose={() => onOpenChange(false)}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
        <h2 id={titleId} className="text-h4 text-foreground">
          {title}
        </h2>
        <Button type="button" size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
      <nav aria-label={title} className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            pathname={pathname}
            mode={mode}
            density={density}
            onNavigate={(href) => {
              onNavigate?.(href);
              onOpenChange(false);
            }}
          />
        ))}
      </nav>
      {footer ? <div className="border-t border-border-subtle p-3">{footer}</div> : null}
    </dialog>
  );
}
