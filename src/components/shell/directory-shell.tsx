import "server-only";

import type { ReactNode } from "react";
import { ProductMemberShell } from "@/components/shell/product-member-shell";
import { ProductPublicShell } from "@/components/shell/product-public-shell";

/** The page supplies server-authenticated membership; directory data stays public. */
export function DirectoryShell({
  isMember,
  children,
}: {
  isMember: boolean;
  children: ReactNode;
}) {
  return isMember ? (
    <ProductMemberShell pathname="/professionals" title="Directory">
      {children}
    </ProductMemberShell>
  ) : (
    <ProductPublicShell pathname="/professionals">{children}</ProductPublicShell>
  );
}
