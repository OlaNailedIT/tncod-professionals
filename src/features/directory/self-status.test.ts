import { beforeEach, describe, expect, it, vi } from "vitest";
import { describeOwnDirectoryStatus, loadDirectoryMemberContext } from "./self-status";

const boundary = vi.hoisted(() => ({ session: vi.fn(), findFirst: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getAuthenticatedUser: boundary.session }));
vi.mock("@/lib/prisma/client", () => ({ getPrisma: () => ({ profile: { findFirst: boundary.findFirst } }) }));

const published = {
  verificationStatus: "VERIFIED" as const,
  visibilityStatus: "DIRECTORY" as const,
  publicSlug: "synthetic-public-profile",
  visibilityPreferences: [{ preference: "PUBLIC" as const }],
};

describe("own directory listing explanation", () => {
  it("does not mistake completion for verification or publication", () => {
    const status = describeOwnDirectoryStatus({ ...published, verificationStatus: "PENDING" });
    expect(status.title).toBe("Your profile is not verified yet");
    expect(status.body).toContain("does not verify or publish");
    expect(status.href).toBe("/profile");
  });

  it.each(["PRIVATE", "MEMBERS_ONLY"] as const)("explains verified but %s without offering self-publication", (visibilityStatus) => {
    const status = describeOwnDirectoryStatus({ ...published, visibilityStatus });
    expect(status.title).toContain("not published");
    expect(status.body).toContain("EXCO publication is a separate step");
  });

  it.each(["PRIVATE", "MEMBERS"] as const)("respects effective identity preference %s", (preference) => {
    const status = describeOwnDirectoryStatus({ ...published, visibilityPreferences: [{ preference }] });
    expect(status.title).toContain("privacy setting prevents");
    expect(status.body).toContain("if Identity is locked");
    expect(status.href).toBe("/settings/privacy");
  });

  it.each([null, ""])("explains a missing public slug without creating one", (publicSlug) => {
    expect(describeOwnDirectoryStatus({ ...published, publicSlug }).title).toContain("link is not ready");
  });

  it("uses the existing PUBLIC default and does not infer absence from filters or pagination", () => {
    const status = describeOwnDirectoryStatus({ ...published, visibilityPreferences: [] });
    expect(status.title).toContain("meets the directory listing requirements");
    expect(status.body).toContain("Filters or pagination");
    expect(JSON.stringify(status)).not.toContain(published.publicSlug);
  });

  it("provides a safe fallback for a missing own profile", () => {
    expect(describeOwnDirectoryStatus(null).title).toContain("could not confirm");
  });
});

describe("session-bound own-state read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    boundary.session.mockResolvedValue({ userId: "signed-in-owner", email: "private@example.invalid" });
    boundary.findFirst.mockResolvedValue(published);
  });

  it("does not read own state for anonymous or centrally rejected inactive identities", async () => {
    boundary.session.mockResolvedValue(null);
    expect(await loadDirectoryMemberContext()).toEqual({ isMember: false, selfStatus: null });
    expect(boundary.findFirst).not.toHaveBeenCalled();
  });

  it("ignores substituted arguments and selects only the active session owner's listing fields", async () => {
    boundary.findFirst.mockResolvedValue({
      ...published,
      email: "never-serialize@example.invalid",
      phone: "never-serialize-phone",
      documents: [{ storageKey: "never-serialize-document-key" }],
      clarificationMessage: "never-serialize-notes",
    });
    const result = await Reflect.apply(loadDirectoryMemberContext, undefined, [{ userId: "another-user" }]);
    expect(boundary.findFirst).toHaveBeenCalledExactlyOnceWith({
      where: {
        userId: "signed-in-owner",
        deletedAt: null,
        user: { is: { accountStatus: "ACTIVE", deletedAt: null } },
      },
      select: {
        verificationStatus: true,
        visibilityStatus: true,
        publicSlug: true,
        visibilityPreferences: { where: { groupKey: "identity" }, select: { preference: true } },
      },
    });
    expect(result.isMember).toBe(true);
    const payload = JSON.stringify(result);
    for (const forbidden of ["signed-in-owner", "another-user", "private@example.invalid", published.publicSlug,
      "verificationStatus", "visibilityPreferences", "documents", "storageKey", "clarificationMessage",
      "never-serialize"]) {
      expect(payload).not.toContain(forbidden);
    }
    expect(Object.keys(result.selfStatus).sort()).toEqual(["body", "href", "linkLabel", "title"]);
  });

  it("uses one owner query, not a public list or result-membership probe", async () => {
    await loadDirectoryMemberContext();
    expect(boundary.findFirst).toHaveBeenCalledTimes(1);
  });

  it("does not silently turn a database error into a successful public result", async () => {
    boundary.findFirst.mockRejectedValue(new Error("synthetic unavailable"));
    await expect(loadDirectoryMemberContext()).rejects.toThrow("synthetic unavailable");
  });
});
