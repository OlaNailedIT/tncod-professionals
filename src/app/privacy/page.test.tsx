import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Isolate notice copy from request-bound session/navigation rendering.
vi.mock("@/components/shell/product-public-shell", () => ({
  ProductPublicShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

import PrivacyNoticePage from "./page";

describe("privacy notice owner-confirmed facts", () => {
  it("identifies the actual operator and country", () => {
    const html = renderToStaticMarkup(<PrivacyNoticePage />);
    expect(html).toContain("operated by Triumphant Nation City of David, Nigeria");
  });

  it("keeps both contact links and states that the inbox is monitored", () => {
    const html = renderToStaticMarkup(<PrivacyNoticePage />);
    expect(html.match(/href="mailto:cityofdavidprofessionals@gmail\.com"/g)).toHaveLength(2);
    expect(html).toContain("This inbox is actively monitored.");
  });

  it("preserves the separate registration, verification and publication rules", () => {
    const html = renderToStaticMarkup(<PrivacyNoticePage />);
    expect(html).toContain("Registration is not verification.");
    expect(html).toContain("Verification is not automatic publication.");
    expect(html).toContain("Visibility preferences in the product are not the same as legal consent.");
  });

  it("does not introduce a consent form or unsupported legal promises", () => {
    const html = renderToStaticMarkup(<PrivacyNoticePage />);
    expect(html).not.toMatch(/<form\b|<input\b/);
    expect(html).not.toMatch(/fully compliant|guaranteed response|registered address/i);
  });
});
