import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfessionalsLogo, ProfessionalsMark } from "./professionals-logo";
import { ParentBrandLogo } from "./logo";
import { PublicShell } from "@/components/shell/public-shell";
import { MemberShell } from "@/components/shell/member-shell";
import { ExcoShell } from "@/components/shell/exco-shell";
import HomePage from "@/app/page";

const expectedHash = "eaded3ebaa8dcff17ce00df0227bda3cd32183b92a729161742962dc52324b05";

describe("approved Professionals brand restoration", () => {
  it.each(["public/brand/professionals-mark.jpg", "src/app/icon.jpg"])(
    "pins the approved bytes at %s", (path) => {
      const bytes = readFileSync(resolve(path));
      expect(bytes.length).toBe(5940);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(expectedHash);
    },
  );
  it("preserves mark artwork and intrinsic ratio without a forced square", () => {
    const html = renderToStaticMarkup(<ProfessionalsMark size={32} title="TNCOD Professionals" />);
    expect(html).toContain('src="/brand/professionals-mark.jpg"');
    expect(html).toContain('width="204"');
    expect(html).toContain('height="192"');
    expect(html).toContain('height:32px');
    expect(html).toContain('width:auto');
    expect(html).toContain('alt="TNCOD Professionals"');
    expect(html).not.toMatch(/professionals-mark\.svg|rounded|filter:/);
  });
  it("gives a standalone lockup one accessible name, while linked art can be decorative", () => {
    const labelled = renderToStaticMarkup(<ProfessionalsLogo />);
    expect(labelled).toContain('role="img" aria-label="TNCOD Professionals"');
    expect(labelled).toContain('alt=""');
    const decorative = renderToStaticMarkup(<ProfessionalsLogo compact alt="" />);
    expect(decorative).toContain('aria-hidden="true"');
    expect(decorative).not.toContain('role="img"');
  });
  it.each([
    ["public", <PublicShell key="public" pathname="/" mode="link">body</PublicShell>, "/"],
    ["member", <MemberShell key="member" pathname="/profile" mode="link">body</MemberShell>, "/dashboard"],
    ["EXCO", <ExcoShell key="exco" pathname="/exco/professionals" mode="link">body</ExcoShell>, "/exco"],
  ] as const)("uses the Professionals mark without changing %s home destinations", (_name, component, href) => {
    const html = renderToStaticMarkup(component);
    expect(html).toContain('/brand/professionals-mark.jpg');
    expect(html).not.toContain('tncod-logo.jpg');
    expect(html).toContain(`href="${href}"`);
  });
  it("keeps the parent asset for attribution with correct intrinsic dimensions", () => {
    const html = renderToStaticMarkup(<ParentBrandLogo />);
    expect(html).toContain('tncod-logo.jpg');
    expect(html).toContain('width="194" height="148"');
  });
  it("removes the hero duplicate but retains parent attribution, privacy link and email-code copy", () => {
    const html = renderToStaticMarkup(<HomePage />);
    const main = html.split('<main')[1]?.split('</main>')[0] ?? "";
    const footer = html.split('<footer')[1] ?? "";
    expect(main).not.toContain('<img');
    expect(main).toContain('one-time code sent to your email');
    expect(main).toContain('Registration is not verification');
    expect(footer).toContain('tncod-logo.jpg');
    expect(footer).toContain('Part of Triumphant Nation City of David.');
    expect(footer).toContain('href="/privacy"');
    expect(html).not.toContain('landing-hero-community');
  });
  it("changes only the approved surface values while retaining foundation/text/focus colours", () => {
    const css = readFileSync(resolve('src/app/globals.css'), 'utf8');
    for (const declaration of [
      '--background: #faf9f6;', '--surface-muted: #f3f0ea;', '--surface-subtle: #ebe7df;',
      '--brand-primary: #0e2954;', '--brand-secondary: #1f75fe;', '--brand-gold: #d4af37;',
      '--brand-white: #ffffff;', '--muted-foreground: #4a5d7a;', '--ring: var(--brand-secondary);',
    ]) expect(css).toContain(declaration);
  });
});
