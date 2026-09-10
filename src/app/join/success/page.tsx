import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, Stack } from "@/components/layout";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { Alert, Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Welcome — TNCOD Professionals",
  description: "Your TNCOD Professionals registration is complete.",
  robots: { index: false, follow: false },
};

export default function JoinSuccessPage() {
  return (
    <ProductPublicShell pathname="/join/success">
      <Container width="narrow" className="py-14">
        <Section density="member">
          <Stack gap="comfortable">
            <div>
              <h1 className="text-h1 text-foreground">You are registered</h1>
              <p className="mt-3 layout-prose text-body text-muted-foreground">
                Thank you for joining TNCOD Professionals. Your professional record has been created
                with private defaults.
              </p>
            </div>

            <Alert intent="info" title="What happens next">
              Your professional record and Auth identity exist, but this page does not sign you in.
              When you are ready, use Sign in with the same email to receive a secure access code.
              Joining does not mean you are verified, and it does not list you in the public
              directory.
            </Alert>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/">Back to home</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </Stack>
        </Section>
      </Container>
    </ProductPublicShell>
  );
}
