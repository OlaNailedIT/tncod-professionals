import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExcoShell } from "./exco-shell";
import { ProductExcoShell } from "./product-exco-shell";

describe("EXCO logo navigation", () => {
  it("is a real EXCO home link in the actual product wrapper", () => {
    const html = renderToStaticMarkup(
      <ProductExcoShell pathname="/exco/professionals">content</ProductExcoShell>,
    );
    expect(html).toMatch(/<a\b(?=[^>]*href="\/exco")(?=[^>]*aria-label="EXCO home")[^>]*>/);
    expect(html).not.toMatch(/<button\b[^>]*aria-label="EXCO home"/);
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Member dashboard");
  });

  it("keeps link semantics even with an optional callback", () => {
    const html = renderToStaticMarkup(
      <ExcoShell pathname="/exco" mode="link" onNavigate={vi.fn()}>content</ExcoShell>,
    );
    expect(html).toMatch(/<a\b(?=[^>]*href="\/exco")(?=[^>]*aria-label="EXCO home")[^>]*>/);
  });

  it("preserves button mode for the interactive showcase", () => {
    const html = renderToStaticMarkup(
      <ExcoShell pathname="/exco/professionals" mode="button" onNavigate={vi.fn()}>
        content
      </ExcoShell>,
    );
    expect(html).toMatch(/<button\b[^>]*type="button"[^>]*aria-label="EXCO home"/);
    expect(html).not.toMatch(/<a\b[^>]*aria-label="EXCO home"/);
  });
});
