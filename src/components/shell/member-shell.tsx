"use client";

import * as React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AccountMenu } from "./account-menu";
import { memberAccountItems, memberNavItems } from "./nav-config";
import { NavLink, type ShellLinkMode } from "./nav-link";
import { NavigationDrawer } from "./navigation-drawer";
import { SkipLink } from "./skip-link";

export type MemberShellProps = {
  pathname: string;
  children: React.ReactNode;
  mode?: ShellLinkMode;
  onNavigate?: (href: string) => void;
  title?: string;
};

/**
 * Member application shell — spacious, friendly density (Phase 5.10).
 */
export function MemberShell({
  pathname,
  children,
  mode = "button",
  onNavigate,
  title = "Member",
}: MemberShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const logo =
    mode === "link" && !onNavigate ? (
      <Link
        href="/dashboard"
        className="max-w-[140px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="TNCOD Professionals home"
      >
        <BrandLogo className="max-w-[140px]" alt="" />
      </Link>
    ) : (
      <button
        type="button"
        className="max-w-[140px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="TNCOD Professionals home"
        onClick={() => onNavigate?.("/dashboard")}
      >
        <BrandLogo className="max-w-[140px]" alt="" />
      </button>
    );

  return (
    <div
      className="flex min-h-screen flex-col bg-background lg:flex-row"
      data-shell="member"
      data-density="member"
    >
      <SkipLink />

      <aside className="hidden w-56 shrink-0 border-r border-border-subtle bg-surface lg:flex lg:flex-col">
        <div className="border-b border-border-subtle px-4 py-4">{logo}</div>
        <nav aria-label="Member" className="flex flex-1 flex-col gap-1 p-3">
          {memberNavItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              pathname={pathname}
              mode={mode}
              density="member"
              onNavigate={onNavigate}
            />
          ))}
        </nav>
        <div className="border-t border-border-subtle p-3">
          <AccountMenu
            items={memberAccountItems}
            pathname={pathname}
            mode={mode}
            onNavigate={onNavigate}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border-subtle bg-surface px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="lg:hidden"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              Menu
            </Button>
            <p className="truncate text-label text-foreground">{title}</p>
          </div>
          <div className="lg:hidden">
            <AccountMenu
              items={memberAccountItems}
              pathname={pathname}
              mode={mode}
              onNavigate={onNavigate}
            />
          </div>
        </header>

        <NavigationDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title="Member menu"
          items={memberNavItems}
          pathname={pathname}
          mode={mode}
          density="member"
          onNavigate={onNavigate}
          footer={
            <>
              <Separator className="mb-3" />
              <AccountMenu
                items={memberAccountItems}
                pathname={pathname}
                mode={mode}
                onNavigate={onNavigate}
              />
            </>
          }
        />

        <main
          id="main-content"
          className="flex-1 px-4 py-6 lg:px-8 lg:py-8"
          data-shell-main="member"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
