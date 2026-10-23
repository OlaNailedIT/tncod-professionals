import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DirectoryPage from "@/app/professionals/page";
import DetailPage from "@/app/professionals/[slug]/page";
import { describeOwnDirectoryStatus } from "./self-status";

const boundary = vi.hoisted(() => ({
  session: vi.fn(), own: vi.fn(), list: vi.fn(), industries: vi.fn(), detail: vi.fn(),
}));
vi.mock("@/server/auth/session", () => ({ getAuthenticatedUser: boundary.session }));
vi.mock("./self-status", async (original) => ({ ...await original<typeof import("./self-status")>(), loadDirectoryMemberContext: boundary.own }));
vi.mock("./list", () => ({
  listDirectoryProfessionals: boundary.list, listDirectoryIndustryOptions: boundary.industries,
  getDirectoryProfessionalBySlug: boundary.detail,
}));
vi.mock("@/components/shell/product-member-shell", () => ({ ProductMemberShell: ({ children }: { children: React.ReactNode }) => <div data-shell="member">{children}</div> }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  notFound: () => { throw Error("NOT_FOUND"); },
}));

const record = {
  publicSlug: "public-person", displayName: "Public Person", headline: null, profession: "Engineer",
  professionalTitle: null, industryName: "Engineering", location: "Lagos", skillNames: [], serviceNames: [],
};

describe("directory page composition, unchanged public-query inputs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boundary.list.mockResolvedValue({ items: [record], total: 1, page: 1, pageSize: 25, pageCount: 1 });
    boundary.industries.mockResolvedValue(["Engineering"]);
    boundary.detail.mockResolvedValue(record);
    boundary.session.mockResolvedValue(null);
    boundary.own.mockResolvedValue({ isMember: false, selfStatus: null });
  });

  it("passes identical parsed queries and no identity to public list/facets for both readers", async () => {
    const params = { q: "Engineer", page: "2" };
    const anonymous = renderToStaticMarkup(await DirectoryPage({ searchParams: Promise.resolve(params) }));
    const firstCall = boundary.list.mock.calls[0];
    expect(anonymous).toContain('data-shell="public"');
    expect(anonymous).not.toContain('aria-label="Your directory listing"');
    boundary.own.mockResolvedValue({ isMember: true, selfStatus: describeOwnDirectoryStatus(null) });
    const member = renderToStaticMarkup(await DirectoryPage({ searchParams: Promise.resolve(params) }));
    expect(member).toContain('data-shell="member"');
    expect(member).toContain('aria-label="Your directory listing"');
    expect(boundary.list.mock.calls[1]).toEqual(firstCall);
    expect(firstCall).toHaveLength(1);
    expect(boundary.industries.mock.calls).toEqual([[], []]);
    for (const html of [anonymous, member]) {
      expect(html).toContain("Public Person");
      expect(html).toContain('data-list-total="1"');
    }
  });

  it("keeps detail on the same public slug query without another person's own-status notice", async () => {
    for (const identity of [null, { userId: "signed-in-member" }]) {
      boundary.session.mockResolvedValue(identity);
      const html = renderToStaticMarkup(await DetailPage({ params: Promise.resolve({ slug: "public-person" }) }));
      expect(html).toContain(`data-shell="${identity ? "member" : "public"}"`);
      expect(html).toContain("Public Person");
      expect(html).not.toContain('aria-label="Your directory listing"');
    }
    expect(boundary.detail.mock.calls).toEqual([["public-person"], ["public-person"]]);
    expect(boundary.own).not.toHaveBeenCalled();
  });

  it.each([null, { userId: "signed-in-member" }])("retains not-found for unavailable/substituted slugs", async (identity) => {
    boundary.session.mockResolvedValue(identity);
    boundary.detail.mockResolvedValue(null);
    await expect(DetailPage({ params: Promise.resolve({ slug: "unavailable-other-person" }) })).rejects.toThrow("NOT_FOUND");
  });
});
