import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { DirectoryShell } from "./directory-shell";
import { ProductMemberShell } from "./product-member-shell";
import { ProductPublicShell } from "./product-public-shell";
import { DirectorySelfStatusNote } from "@/features/directory/self-status-note";
import { describeOwnDirectoryStatus } from "@/features/directory/self-status";

const boundary = vi.hoisted(() => ({ session: vi.fn(), excoAccess: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthenticatedUser: boundary.session }));
vi.mock("@/features/exco/dashboard-metrics", () => ({ hasExcoDashboardAccess: boundary.excoAccess }));

describe("existing shell continuity for directory readers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the public shell and no own-status notice for anonymous readers", () => {
    const shell = DirectoryShell({ isMember: false, children: <p>Public record</p> });
    expect(shell.type).toBe(ProductPublicShell);
    const html = renderToStaticMarkup(shell);
    expect(html).toContain('data-shell="public"');
    expect(html).not.toContain('data-shell="member"');
    expect(renderToStaticMarkup(<DirectorySelfStatusNote status={null} />)).toBe("");
  });

  it.each([
    ["MEMBER", false], ["EXCO_VIEWER", true], ["EXCO_ADMIN", true], ["SUPER_ADMIN", true],
  ])("reuses member navigation and the existing server EXCO check for %s", async (role, showExco) => {
    boundary.session.mockResolvedValue({ userId: role });
    boundary.excoAccess.mockResolvedValue(showExco);
    const shell = DirectoryShell({ isMember: true, children: <p>Public record only</p> });
    expect(shell.type).toBe(ProductMemberShell);
    const html = renderToStaticMarkup(await ProductMemberShell(shell.props));
    expect(html).toContain('data-shell="member"');
    for (const href of ["/dashboard", "/professionals", "/profile", "/businesses", "/opportunities", "/settings"]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html.includes('href="/exco"')).toBe(showExco);
    expect(boundary.excoAccess).toHaveBeenCalledWith(role);
  });

  it("renders only guidance and a real existing-route link, not privileged raw fields", () => {
    const status = describeOwnDirectoryStatus(null);
    const html = renderToStaticMarkup(<DirectorySelfStatusNote status={status} />);
    expect(html).toContain('aria-label="Your directory listing"');
    expect(html).toContain('href="/profile"');
    expect(html).not.toContain("<button");
    expect(html).not.toContain("userId");
  });
});
