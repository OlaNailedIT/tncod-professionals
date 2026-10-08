import type { Metadata } from "next";
import Link from "next/link";
import { Container, Section, Stack } from "@/components/layout";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { Alert, Button } from "@/components/ui";
import {
  JOIN_SUCCESS_HEADING,
  JOIN_SUCCESS_LEAD,
  JOIN_SUCCESS_NEXT_BODY,
  JOIN_SUCCESS_NEXT_TITLE,
  JOIN_SUCCESS_SUPPORT_EMAIL,
  JOIN_SUCCESS_SUPPORT_HREF,
} from "@/features/registration/join-success-copy";

export const metadata: Metadata = {
  title: "Welcome — TNCOD Professionals",
  description: "Your TNCOD Professionals join request was received.",
  robots: { index: false, follow: false },
};

/**
 * Same public page for genuine registration and intentional neutral accepts.
 * Copy must not claim Auth or a professional record was created.
 */
export default function JoinSuccessPage() {
  return (
    <ProductPublicShell pathname="/join/success">
      <Container width="narrow" className="py-14">
        <Section density="member">
          <Stack gap="comfortable">
            <div>
              <h1 className="text-h1 text-foreground">{JOIN_SUCCESS_HEADING}</h1>
              <p className="mt-3 layout-prose text-body text-muted-foreground">{JOIN_SUCCESS_LEAD}</p>
            </div>

            <Alert intent="info" title={JOIN_SUCCESS_NEXT_TITLE}>
              {JOIN_SUCCESS_NEXT_BODY}
            </Alert>

            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <a href={JOIN_SUCCESS_SUPPORT_HREF}>Email {JOIN_SUCCESS_SUPPORT_EMAIL}</a>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </Stack>
        </Section>
      </Container>
    </ProductPublicShell>
  );
}
