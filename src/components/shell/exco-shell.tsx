"use client";

import * as React from "react";
import Link from "next/link";
import { ProfessionalsLogo } from "@/components/brand/professionals-logo";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";
import { excoMemberReturnItem, excoNavGroups, excoNavItems } from "./nav-config";
import { NavLink, type ShellLinkMode } from "./nav-link";
import { NavigationDrawer } from "./navigation-drawer";
import { SkipLink } from "./skip-link";

export type ExcoShellProps = {
  pathname: string;
  children: React.ReactNode;
  mode?: ShellLinkMode;
  onNavigate?: (href: string) => void;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
};

/**
 * EXCO application shell — denser operational chrome (Phase 5.10).
 * Same platform language; denser spacing via existing tokens.
 */
export function ExcoShell({
  pathname,
  children,
  mode = "button",
  onNavigate,
  title = "EXCO workspace",
  breadcrumbs,
}: ExcoShellProps) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const memberReturn = (
    <NavLink
      href={excoMemberReturnItem.href}
      label={excoMemberReturnItem.label}
      pathname={pathname}
      mode={mode}
      density="exco"
      onNavigate={onNavigate}
    />
  );

  return (
    <div
      className="flex min-h-screen flex-col bg-background lg:flex-row"
      data-shell="exco"
      data-density="exco"
    >
      <SkipLink />

      <aside className="hidden w-52 shrink-0 border-r border-border-subtle bg-surface lg:flex lg:flex-col">
        <div className="border-b border-border-subtle px-3 py-3">
          {mode === "link" ? (
            <Link
              href="/exco"
              className="max-w-[160px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="EXCO home"
              onClick={() => onNavigate?.("/exco")}
            >
              <ProfessionalsLogo compact alt="" />
            </Link>
          ) : (
            <button
              type="button"
              className="max-w-[160px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="EXCO home"
              onClick={() => onNavigate?.("/exco")}
            >
              <ProfessionalsLogo compact alt="" />
            </button>
          )}
          <p className="mt-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
            EXCO
          </p>
        </div>
        <nav aria-label="EXCO" className="flex flex-1 flex-col gap-4 overflow-y-auto p-2">
          {excoNavGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    pathname={pathname}
                    mode={mode}
                    density="exco"
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-border-subtle p-2">
          <p className="mb-1 px-2 text-caption font-medium uppercase tracking-wide text-muted-foreground">
            Member
          </p>
          {memberReturn}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border-subtle bg-surface px-3 py-2 lg:px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
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
              <div className="min-w-0">
                <p className="truncate text-label text-foreground">{title}</p>
                {breadcrumbs ? (
                  <Breadcrumbs
                    items={breadcrumbs}
                    className="mt-0.5"
                    onNavigate={onNavigate}
                  />
                ) : null}
              </div>
            </div>
            <div className="shrink-0">{memberReturn}</div>
          </div>
        </header>

        <NavigationDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          title="EXCO menu"
          items={excoNavItems}
          pathname={pathname}
          mode={mode}
          density="exco"
          onNavigate={onNavigate}
          footer={
            <>
              <div className="mb-2">
                <p className="mb-1 px-1 text-caption font-medium uppercase tracking-wide text-muted-foreground">
                  Member
                </p>
                <NavLink
                  href={excoMemberReturnItem.href}
                  label={excoMemberReturnItem.label}
                  pathname={pathname}
                  mode={mode}
                  density="exco"
                  onNavigate={(href) => {
                    onNavigate?.(href);
                    if (mode === "button") {
                      setDrawerOpen(false);
                    } else {
                      queueMicrotask(() => setDrawerOpen(false));
                    }
                  }}
                />
              </div>
              <Separator className="mb-2" />
              <p className="text-caption text-muted-foreground">
                Navigation is presentational. Access is enforced separately.
              </p>
            </>
          }
        />

        <main
          id="main-content"
          className="flex-1 px-3 py-4 lg:px-5 lg:py-5"
          data-shell-main="exco"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
