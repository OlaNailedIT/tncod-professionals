"use client";

import * as React from "react";
import { PublicShell } from "@/components/shell/public-shell";

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
            <p className="text-caption text-muted-foreground">
              TNCOD Professionals — a community professional network. Collection is not
              publication.
            </p>
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
