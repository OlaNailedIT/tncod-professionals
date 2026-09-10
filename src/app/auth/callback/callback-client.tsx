"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";
import { Container, Section, Stack } from "@/components/layout";
import { Alert, Spinner } from "@/components/ui";

/**
 * Completes passwordless Auth: PKCE `code` query and/or hash session tokens.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function complete() {
      const next = sanitizeNextPath(searchParams.get("next"));
      let supabase;
      try {
        supabase = createBrowserSupabaseClient();
      } catch {
        if (!cancelled) setError("Sign-in is not configured.");
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError("That sign-in link is invalid or has expired.");
          return;
        }
        router.replace(next);
        router.refresh();
        return;
      }

      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash.includes("access_token")) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (cancelled) return;
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
          if (sessionError) {
            setError("That sign-in link is invalid or has expired.");
            return;
          }
          router.replace(next);
          router.refresh();
          return;
        }
      }

      if (!cancelled) {
        setError("That sign-in link is invalid or has expired.");
      }
    }

    void complete();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <Container width="narrow" className="py-14">
      <Section density="member">
        <Stack gap="comfortable">
          {error ? (
            <Alert intent="warning" title="Sign-in link issue">
              {error}{" "}
              <a className="underline" href="/sign-in">
                Request a new code
              </a>
              .
            </Alert>
          ) : (
            <div className="flex items-center gap-3 text-body text-muted-foreground" role="status">
              <Spinner />
              Completing sign-in…
            </div>
          )}
        </Stack>
      </Section>
    </Container>
  );
}
