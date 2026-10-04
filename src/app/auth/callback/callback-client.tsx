"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Container, Section, Stack } from "@/components/layout";
import { Alert, Spinner } from "@/components/ui";
import { completePkceCallback } from "./pkce-callback";
import { exchangeSignInCodeAction } from "./exchange-action";

/**
 * Completes passwordless Auth using the verifier-bound PKCE `code` query.
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = React.useState<string | null>(null);
  const attemptedCode = React.useRef<string | null>(null);

  React.useEffect(() => {
    const code = searchParams.get("code");
    if (code && attemptedCode.current === code) return;
    attemptedCode.current = code;
    let cancelled = false;

    async function complete() {
      let result;
      try {
        result = await completePkceCallback(searchParams, exchangeSignInCodeAction);
      } catch {
        if (!cancelled) setError("That sign-in link is invalid or has expired.");
        return;
      }
      if (cancelled) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }

      router.replace(result.next);
      router.refresh();
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
