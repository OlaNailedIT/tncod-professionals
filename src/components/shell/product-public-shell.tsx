"use client";

import * as React from "react";
import { PublicShell } from "@/components/shell/public-shell";
import { ParentBrandLogo } from "@/components/brand/logo";

/**
 * Product wrapper: PublicShell with Next.js link navigation.
 */
export function ProductPublicShell({
  pathname,
  children,
  footer,
}: {
  pathname: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <PublicShell
      pathname={pathname}
      mode="link"
      footer={
        footer ?? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <ParentBrandLogo className="max-w-12 shrink-0" alt="" />
              <div className="min-w-0 text-caption text-muted-foreground">
                <p>Part of Triumphant Nation City of David.</p>
                <p>
                  TNCOD Professionals — a community professional network. Collection is not
                  publication.
                </p>
              </div>
            </div>
            <a
              href="/privacy"
              className="text-caption text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Privacy Notice
            </a>
          </div>
        )
      }
    >
      {children}
    </PublicShell>
  );
}
