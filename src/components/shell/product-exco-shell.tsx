"use client";

import * as React from "react";
import Link from "next/link";
import { ExcoShell } from "@/components/shell/exco-shell";

export function ProductExcoShell({
  pathname,
  children,
  title,
}: {
  pathname: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <ExcoShell pathname={pathname} mode="link" title={title}>
      {children}
    </ExcoShell>
  );
}

export { Link };
