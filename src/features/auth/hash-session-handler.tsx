"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

/**
 * Local/dev Auth sometimes returns tokens in the URL hash after magic-link verify.
 * Establish the session client-side, then hard-navigate to a safe internal path.
 * Does not store secrets in application state beyond Supabase's session cookies.
 */
export function AuthHashSessionHandler({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<"idle" | "working" | "error">("idle");

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) return;

    let supabase;
    try {
      supabase = createBrowserSupabaseClient();
    } catch {
      setStatus("error");
      return;
    }

    let cancelled = false;
    setStatus("working");
    void (async () => {
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (cancelled) return;
      // Clear tokens from the address bar.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      if (error) {
        setStatus("error");
        return;
      }
      const next = sanitizeNextPath(nextPath);
      router.replace(next);
      router.refresh();
    })();

    return () => {
      cancelled = true;
    };
  }, [nextPath, router]);

  if (status === "working") {
    return (
      <p className="sr-only" role="status">
        Completing sign-in…
      </p>
    );
  }
  if (status === "error") {
    return (
      <p className="text-body-sm text-danger" role="alert">
        We could not complete sign-in from that link. Request a new code.
      </p>
    );
  }
  return null;
}
