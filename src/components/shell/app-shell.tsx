"use client";

import * as React from "react";
import type { BreadcrumbItem } from "./breadcrumbs";
import { ExcoShell } from "./exco-shell";
import { MemberShell } from "./member-shell";
import { PublicShell } from "./public-shell";
import type { ShellLinkMode } from "./nav-link";

export type AppShellContext = "public" | "member" | "exco";

export type AppShellProps = {
  context: AppShellContext;
  pathname: string;
  children: React.ReactNode;
  mode?: ShellLinkMode;
  onNavigate?: (href: string) => void;
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  footer?: React.ReactNode;
};

/**
 * Context switcher for application shells (Phase 5.10).
 * Does not perform Auth or authorization.
 */
export function AppShell({
  context,
  pathname,
  children,
  mode,
  onNavigate,
  title,
  breadcrumbs,
  footer,
}: AppShellProps) {
  if (context === "public") {
    return (
      <PublicShell pathname={pathname} mode={mode} onNavigate={onNavigate} footer={footer}>
        {children}
      </PublicShell>
    );
  }
  if (context === "member") {
    return (
      <MemberShell pathname={pathname} mode={mode} onNavigate={onNavigate} title={title}>
        {children}
      </MemberShell>
    );
  }
  return (
    <ExcoShell
      pathname={pathname}
      mode={mode}
      onNavigate={onNavigate}
      title={title}
      breadcrumbs={breadcrumbs}
    >
      {children}
    </ExcoShell>
  );
}
