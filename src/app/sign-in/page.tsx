import type { Metadata } from "next";
import { Container, Section, Stack } from "@/components/layout";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { Alert } from "@/components/ui";
import { AuthHashSessionHandler } from "@/features/auth/hash-session-handler";
import { SignInForm } from "@/features/auth/sign-in-form";
import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

export const metadata: Metadata = {
  title: "Sign in — TNCOD Professionals",
  description: "Passwordless access to your TNCOD Professionals profile.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = sanitizeNextPath(params.next);
  const authError = params.error === "auth" || params.error === "config";

  return (
    <ProductPublicShell pathname="/sign-in">
      <AuthHashSessionHandler nextPath={nextPath} />
      {authError ? (
        <Container width="narrow" className="pt-10">
          <Section density="member">
            <Stack gap="comfortable">
              <Alert intent="warning" title="Sign-in link issue">
                That sign-in link is invalid or has expired. Enter your email below to request a new
                code.
              </Alert>
            </Stack>
          </Section>
        </Container>
      ) : null}
      <SignInForm nextPath={nextPath} />
    </ProductPublicShell>
  );
}
