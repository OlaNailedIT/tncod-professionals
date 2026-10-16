import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NavLink } from "@/components/shell/nav-link";

describe("NavLink DEF-23C-01 mode boundary", () => {
  it("renders an anchor with href in link mode even when onNavigate is provided", () => {
    const html = renderToStaticMarkup(
      <NavLink
        href="/sign-in"
        label="Sign in"
        pathname="/"
        mode="link"
        onNavigate={vi.fn()}
      />,
    );
    expect(html).toContain('href="/sign-in"');
    expect(html).toContain("Sign in");
    expect(html).not.toContain("<button");
  });

  it("renders a button in button mode for showcase shells", () => {
    const html = renderToStaticMarkup(
      <NavLink
        href="/profile"
        label="Profile"
        pathname="/dashboard"
        mode="button"
        onNavigate={vi.fn()}
      />,
    );
    expect(html).toContain("<button");
    expect(html).not.toContain('href="/profile"');
    expect(html).toContain("Profile");
  });

  it("renders a link in link mode when onNavigate is omitted", () => {
    const html = renderToStaticMarkup(
      <NavLink href="/professionals" label="Professionals" pathname="/" mode="link" />,
    );
    expect(html).toContain('href="/professionals"');
    expect(html).not.toContain("<button");
  });
});
