import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";
import { PublicShell } from "@/components/shell/public-shell";
import { MemberShell } from "@/components/shell/member-shell";
import { ExcoShell } from "@/components/shell/exco-shell";
import { PlatformAttribution } from "./platform-attribution";

vi.mock("@/lib/fonts", () => ({ inter: { variable: "test-font" } }));

describe("platform attribution", () => {
  it("renders the requested credit as a normal link without exposing a member-page referrer", () => {
    const html = renderToStaticMarkup(<PlatformAttribution />);
    expect(html).toContain('aria-label="Platform attribution"');
    expect(html).toContain('href="https://viix.solutions"');
    expect(html).toContain("Powered by VIIX Solutions</a>");
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).not.toMatch(/target=|<script|<iframe|position:fixed/);
  });

  it.each([
    ["public", <PublicShell key="public" pathname="/" mode="link" footer="Church attribution and privacy">Public content</PublicShell>],
    ["member", <MemberShell key="member" pathname="/dashboard" mode="link">Member content</MemberShell>],
    ["EXCO", <ExcoShell key="exco" pathname="/exco" mode="link">EXCO content</ExcoShell>],
    ["shell-independent", <main key="other">Other page content</main>],
  ] as const)("includes exactly one credit after %s page content", (_name, children) => {
    const html = renderToStaticMarkup(<RootLayout>{children}</RootLayout>);
    expect(html.match(/Powered by VIIX Solutions/g)).toHaveLength(1);
    expect(html.match(/href="https:\/\/viix\.solutions"/g)).toHaveLength(1);
    expect(html.indexOf("Powered by VIIX Solutions")).toBeGreaterThan(html.lastIndexOf("</main>"));
    expect(html).toContain('lang="en"');
  });

  it("preserves existing public footer content instead of replacing it", () => {
    const html = renderToStaticMarkup(
      <RootLayout>
        <PublicShell pathname="/" mode="link" footer={<a href="/privacy">Privacy Notice</a>}>
          <p>Collection is not publication.</p>
        </PublicShell>
      </RootLayout>,
    );
    expect(html).toContain('href="/privacy"');
    expect(html).toContain("Collection is not publication.");
    expect(html).toContain("Powered by VIIX Solutions");
  });
});
