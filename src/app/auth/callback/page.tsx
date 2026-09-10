import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import AuthCallbackClient from "./callback-client";

export const metadata: Metadata = {
  title: "Completing sign-in — TNCOD Professionals",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <ProductPublicShell pathname="/auth/callback">
      <Suspense
        fallback={
          <p className="p-10 text-center text-body text-muted-foreground" role="status">
            Completing sign-in…
          </p>
        }
      >
        <AuthCallbackClient />
      </Suspense>
    </ProductPublicShell>
  );
}
