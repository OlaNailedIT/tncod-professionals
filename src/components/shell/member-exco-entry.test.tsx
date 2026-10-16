import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemberShell } from "@/components/shell/member-shell";
import {
  memberAccountMenuItems,
  memberNavigationItems,
} from "@/components/shell/nav-config";

describe("EXCO workspace entry", () => {
  it("omits the entry for members and anonymous shells", () => {
    expect(memberNavigationItems(false).map((item) => item.href)).not.toContain("/exco");
    expect(memberAccountMenuItems(false).map((item) => item.href)).not.toContain("/exco");

    const html = renderToStaticMarkup(
      <MemberShell pathname="/dashboard" mode="link" showExco={false}>
        <p>Home</p>
      </MemberShell>,
    );
    expect(html).not.toContain('href="/exco"');
  });

  it("shows EXCO in desktop nav, the phone/tablet drawer, and the account list", () => {
    expect(memberNavigationItems(true).at(-1)).toEqual({ href: "/exco", label: "EXCO" });
    expect(memberAccountMenuItems(true)[0]).toEqual({ href: "/exco", label: "EXCO" });

    const html = renderToStaticMarkup(
      <MemberShell pathname="/dashboard" mode="link" showExco>
        <p>Home</p>
      </MemberShell>,
    );
    const sidebar = html.split('aria-label="Member"')[1]?.split("</nav>")[0] ?? "";
    const drawer = html.split('aria-label="Member menu"')[1]?.split("</nav>")[0] ?? "";
    expect(sidebar).toContain('href="/exco"');
    expect(sidebar).toContain(">EXCO<");
    expect(drawer).toContain('href="/exco"');
    expect(drawer).toContain(">EXCO<");
    expect(html.match(/href="\/exco"/g)?.length).toBe(2);
  });

  it("keeps member and profile destinations when the EXCO entry is shown", () => {
    expect(memberNavigationItems(true).map((item) => item.href)).toEqual([
      "/dashboard",
      "/professionals",
      "/profile",
      "/businesses",
      "/opportunities",
      "/settings",
      "/exco",
    ]);
    expect(memberAccountMenuItems(true).map((item) => item.href)).toEqual([
      "/exco",
      "/profile",
      "/settings",
      "/auth/sign-out",
    ]);
  });
});
