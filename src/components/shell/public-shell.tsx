"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { Container } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { publicNavItems } from "./nav-config";
import { NavLink, type ShellLinkMode } from "./nav-link";
import { NavigationDrawer } from "./navigation-drawer";
import { SkipLink } from "./skip-link";

export type PublicShellProps = {
  pathname: string;
  children: React.ReactNode;
  mode?: ShellLinkMode;
  onNavigate?: (href: string) => void;
  /** Optional footer content */
  footer?: React.ReactNode;
};

/**
 * Public application shell — light chrome (Phase 5.10).
 * Product pages use mode="link"; design-system specimens may use buttons.
 */
export function PublicShell({
  pathname,
  children,
  mode = "button",
  onNavigate,
  footer,
}: PublicShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const logo =
    mode === "link" && !onNavigate ? (
      <Link
        href="/"
        className="max-w-[160px] shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="TNCOD Professionals home"
      >
        <BrandLogo className="max-w-[160px]" alt="" />
      </Link>
    ) : (
      <button
        type="button"
        className="max-w-[160px] shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="TNCOD Professionals home"
        onClick={() => onNavigate?.("/")}
      >
        <BrandLogo className="max-w-[160px]" alt="" />
      </button>
    );

  return (
    <div className="flex min-h-screen flex-col bg-background" data-shell="public">
      <SkipLink />
      <header className="border-b border-border-subtle bg-surface">
        <Container width="wide" className="flex items-center justify-between gap-4 py-3">
          {logo}

          <nav aria-label="Public" className="hidden items-center gap-1 md:flex">
            {publicNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                pathname={pathname}
                mode={mode}
                onNavigate={onNavigate}
                className="w-auto"
              />
            ))}
          </nav>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="md:hidden"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            Menu
          </Button>
        </Container>
      </header>

      <NavigationDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title="Menu"
        items={publicNavItems}
        pathname={pathname}
        mode={mode}
        onNavigate={onNavigate}
      />

      <main id="main-content" className="flex-1">
        {children}
      </main>

      {footer !== undefined ? (
        <footer className="border-t border-border-subtle bg-surface">
          <Container width="wide" className="py-6">
            {footer}
          </Container>
        </footer>
      ) : (
        <footer className="border-t border-border-subtle bg-surface">
          <Container width="wide" className="py-6">
            <p className="text-caption text-muted-foreground">
              TNCOD Professionals — public shell specimen. Not a product page.
            </p>
            <Separator className="my-3" />
            <p className="text-caption text-muted-foreground">Design-system laboratory only.</p>
          </Container>
        </footer>
      )}
    </div>
  );
}
