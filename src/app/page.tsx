import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";
import { Container, Section, Stack } from "@/components/layout";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { Button } from "@/components/ui/button";
import { AuthHashSessionHandler } from "@/features/auth/hash-session-handler";

export const metadata: Metadata = {
  title: "TNCOD Professionals",
  description:
    "TNCOD Professionals — identify, understand, connect and activate professional capacity in the TNCOD community.",
};

export default function HomePage() {
  return (
    <ProductPublicShell pathname="/">
      <AuthHashSessionHandler nextPath="/dashboard" />
      <div className="relative overflow-hidden border-b border-border-subtle bg-gradient-to-b from-surface via-background to-background">
        <Container width="standard" className="py-16 md:py-24">
          <Stack gap="comfortable">
            <BrandLogo className="max-w-[280px]" priority />
            <div className="max-w-2xl">
              <h1 className="text-display text-foreground">TNCOD Professionals</h1>
              <p className="mt-4 text-body-lg text-muted-foreground">
                A community professional network to identify, understand, connect and activate the
                capacity within TNCOD — without turning participation into a bureaucratic process.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="min-h-11">
                <Link href="/join">Join TNCOD Professionals</Link>
              </Button>
              <Button asChild variant="outline" className="min-h-11">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </Stack>
        </Container>
      </div>

      <Container width="standard" className="py-14">
        <Section density="member">
          <Stack gap="section">
            <section>
              <h2 className="text-h2 text-foreground">What it is</h2>
              <p className="mt-3 max-w-2xl layout-prose text-body text-muted-foreground">
                TNCOD Professionals helps the community see who we have, what they do, what they need,
                and what they can offer — so connections can happen responsibly.
              </p>
            </section>

            <section>
              <h2 className="text-h2 text-foreground">Who can join</h2>
              <p className="mt-3 max-w-2xl layout-prose text-body text-muted-foreground">
                Everyone connected to the TNCOD community who wants to participate professionally —
                employees, entrepreneurs, freelancers, students, job seekers, retirees, and people in
                transition. You do not need to be currently employed.
              </p>
            </section>

            <section>
              <h2 className="text-h2 text-foreground">Why join</h2>
              <p className="mt-3 max-w-2xl layout-prose text-body text-muted-foreground">
                Create a professional record quickly, share what you are looking for and what you can
                offer, and stay findable to the community under privacy controls you choose later.
              </p>
            </section>

            <section>
              <h2 className="text-h2 text-foreground">How it works</h2>
              <ol className="mt-3 max-w-2xl list-decimal space-y-2 pl-5 text-body text-muted-foreground">
                <li>Join with a short registration — about a minute, no password.</li>
                <li>We create your professional record with private defaults.</li>
                <li>Sign in later with a passwordless email link when you need access.</li>
              </ol>
              <p className="mt-4 max-w-2xl text-body-sm text-muted-foreground">
                Registration is not verification, and it does not publish you to the directory.
              </p>
            </section>

            <div>
              <Button asChild className="min-h-11">
                <Link href="/join">Join TNCOD Professionals</Link>
              </Button>
            </div>
          </Stack>
        </Section>
      </Container>
    </ProductPublicShell>
  );
}
