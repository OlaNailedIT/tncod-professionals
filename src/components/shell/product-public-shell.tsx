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
          <p className="text-caption text-muted-foreground">
            TNCOD Professionals — a community professional network. Collection is not publication.
          </p>
        )
      }
    >
      {children}
    </PublicShell>
  );
}
