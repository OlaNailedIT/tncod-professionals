"use client";

import * as React from "react";
import Link from "next/link";
import { MemberShell } from "@/components/shell/member-shell";

/**
 * Product wrapper: MemberShell with Next.js link navigation.
 */
export function ProductMemberShell({
  pathname,
  children,
  title,
}: {
  pathname: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <MemberShell pathname={pathname} mode="link" title={title}>
      {children}
    </MemberShell>
  );
}

/** Re-export Link for pages that need branded CTAs inside member content. */
export { Link };
