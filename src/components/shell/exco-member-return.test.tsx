import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ExcoShell } from "@/components/shell/exco-shell";
import {
  excoMemberReturnItem,
  excoNavGroups,
  excoNavItems,
  excoWorkspaceItem,
} from "@/components/shell/nav-config";

describe("EXCO → member workspace return", () => {
  it("keeps a labelled Member dashboard link to /dashboard, separate from EXCO Dashboard", () => {
    expect(excoMemberReturnItem).toEqual({
      href: "/dashboard",
      label: "Member dashboard",
    });
    expect(excoWorkspaceItem.href).toBe("/exco");

    const overview = excoNavGroups.find((group) => group.label === "Overview");
    const excoDashboard = overview?.items.find((item) => item.href === "/exco");
    expect(excoDashboard?.label).toBe("Dashboard");
    expect(excoNavItems.map((item) => item.href)).not.toContain("/dashboard");
    expect(excoDashboard?.label).not.toBe(excoMemberReturnItem.label);
  });

  it("renders the return link in the shared EXCO shell for desktop, header, and drawer", () => {
    const html = renderToStaticMarkup(
      <ExcoShell pathname="/exco/analytics" mode="link">
        <p>body</p>
      </ExcoShell>,
    );

    expect(html).toContain('data-shell="exco"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain("Member dashboard");
    expect(html).toContain('href="/exco"');
    // Overview EXCO dashboard label stays; return label is distinct.
    expect(html).toMatch(/>Dashboard</);
    expect(html).toMatch(/>Member dashboard</);

    const memberAnchors = [...html.matchAll(/href="\/dashboard"/g)];
    // Sidebar footer + header (drawer footer mounts with the dialog).
    expect(memberAnchors.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps real link navigation in product mode and preserves EXCO destinations", () => {
    const html = renderToStaticMarkup(
      <ExcoShell pathname="/exco/professionals" mode="link">
        <p>body</p>
      </ExcoShell>,
    );

    expect(html).toContain('href="/exco/professionals"');
    expect(html).toContain('href="/exco/verification"');
    expect(html).toContain('href="/opportunities"');
    expect(html).not.toMatch(/href="\/dashboard"[^>]*>\s*Dashboard\s*</);
  });
});
