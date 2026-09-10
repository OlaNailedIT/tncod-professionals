import { describe, expect, it } from "vitest";
import {
  assertTrustedUserId,
  clientMayAssignRole,
  directoryListingAllowed,
  memberMaySetDirectoryVisibility,
  memberMaySetVerification,
} from "./authorization";

describe("authorization primitives", () => {
  it("rejects client-supplied user ids", () => {
    expect(() => assertTrustedUserId("a", "b")).toThrow();
    expect(assertTrustedUserId("a")).toBe("a");
  });

  it("never allows client role assignment", () => {
    expect(clientMayAssignRole("MEMBER", "SUPER_ADMIN")).toBe(false);
  });

  it("preserves DIRECTORY requires VERIFIED", () => {
    expect(directoryListingAllowed("VERIFIED", "DIRECTORY")).toBe(true);
    expect(directoryListingAllowed("PENDING", "DIRECTORY")).toBe(false);
  });

  it("forbids member verification and DIRECTORY writes", () => {
    expect(memberMaySetVerification("PENDING", "VERIFIED")).toBe(false);
    expect(memberMaySetDirectoryVisibility()).toBe(false);
  });
});
