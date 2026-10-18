import type { Metadata } from "next";
import Link from "next/link";
import { ProductPublicShell } from "@/components/shell/product-public-shell";
import { Container, Section, Stack } from "@/components/layout";

export const metadata: Metadata = {
  title: "Privacy Notice — TNCOD Professionals",
  description: "How TNCOD Professionals handles information in the community professional network.",
  robots: { index: true, follow: true },
};

/**
 * Factual Privacy Notice surface (PRIVACY-L1).
 * Legal sign-off remains pending — see docs/legal/privacy-notice-candidate.md.
 * No consent checkbox / no consent DB flag.
 */
export default function PrivacyNoticePage() {
  return (
    <ProductPublicShell pathname="/privacy">
      <Container width="standard" className="py-10 md:py-14">
        <Stack gap="section">
          <header className="max-w-2xl">
            <p className="text-caption font-medium uppercase tracking-wide text-muted-foreground">
              TNCOD Professionals
            </p>
            <h1 className="mt-1 text-h1 text-foreground">Privacy Notice</h1>
            <p className="mt-3 text-body text-muted-foreground">
              This notice describes how the TNCOD Professionals product handles information, based on
              how the service works today. It is provided for transparency. Visibility preferences in
              the product are not the same as legal consent.
            </p>
          </header>

          <Section>
            <Stack gap="comfortable">
              <div>
                <h2 className="text-h2 text-foreground">Who we are</h2>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  TNCOD Professionals is a community professional network operated by Triumphant Nation City of David, Nigeria,
                  for professionals and related community participants. For privacy questions about this
                  product, contact{" "}
                  <a className="underline underline-offset-2" href="mailto:cityofdavidprofessionals@gmail.com">
                    cityofdavidprofessionals@gmail.com
                  </a>
                  . This inbox is actively monitored.
                </p>
              </div>

              <div>
                <h2 className="text-h2 text-foreground">What this service is</h2>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  Members can create and manage a professional record, complete a profile over time,
                  express interest in opportunities, optionally add business information, and — only
                  after verification and publication decisions — appear in a controlled professionals
                  directory. EXCO operators review records for verification and community operations.
                </p>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  Registration is not verification. Verification is not automatic publication.
                  Publication is not the same as a member&apos;s visibility preference.
                </p>
              </div>

              <div>
                <h2 className="text-h2 text-foreground">Information we collect</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-muted-foreground">
                  <li>
                    Account and registration details such as name, email, phone/WhatsApp, professional
                    situation, profession, optional organisation, and what you seek or offer.
                  </li>
                  <li>
                    Profile fields you choose to complete, profile completion progress, verification and
                    directory status fields used by the product.
                  </li>
                  <li>
                    Visibility preferences that control how allowlisted fields may appear in directory
                    projections.
                  </li>
                  <li>
                    Optional business profile information and private verification documents submitted
                    for business verification review.
                  </li>
                  <li>
                    Expressions of interest in opportunities (a connection signal — not messaging or
                    contact exchange in the current product).
                  </li>
                  <li>
                    Authentication session data for passwordless email sign-in, and operational logs or
                    audit events needed to run and protect the service.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-h2 text-foreground">How we use information</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-body text-muted-foreground">
                  <li>To create and maintain your professional record and let you sign in securely.</li>
                  <li>To support profile editing, verification review, and publication decisions.</li>
                  <li>
                    To show eligible professionals in the controlled directory under product privacy
                    rules.
                  </li>
                  <li>To operate opportunities and interest signals.</li>
                  <li>To protect the service against abuse and support authorised EXCO operations.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-h2 text-foreground">Who can see information</h2>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  You can access your own record while signed in. EXCO operators with the appropriate
                  roles can access operational views needed for verification, directory operations, and
                  aggregates. Directory visitors see only the controlled projection of professionals who
                  are verified and published, subject to visibility preferences and product withhold
                  rules. Some contact and community fields remain private from public directory exposure
                  in the current product.
                </p>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  The application and authentication providers that host this service process data as
                  needed to operate the platform.
                </p>
              </div>

              <div>
                <h2 className="text-h2 text-foreground">Visibility preferences</h2>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  Directory and profile visibility preferences are product controls. They do not, by
                  themselves, grant access. A generic consent-management engine is not part of the
                  current product. Joining or signing in is not implemented as recording a separate
                  legal-consent database flag.
                </p>
                <p className="mt-3">
                  <Link
                    href="/settings/privacy"
                    className="text-body text-foreground underline underline-offset-2"
                  >
                    Signed-in members can manage visibility preferences
                  </Link>
                  .
                </p>
              </div>

              <div>
                <h2 className="text-h2 text-foreground">Sessions</h2>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  The signed-in product uses session cookies required for authentication and application
                  operation.
                </p>
              </div>

              <div>
                <h2 className="text-h2 text-foreground">Contact</h2>
                <p className="mt-3 layout-prose text-body text-muted-foreground">
                  Questions about this notice:{" "}
                  <a className="underline underline-offset-2" href="mailto:cityofdavidprofessionals@gmail.com">
                    cityofdavidprofessionals@gmail.com
                  </a>
                  .
                </p>
              </div>
            </Stack>
          </Section>
        </Stack>
      </Container>
    </ProductPublicShell>
  );
}
