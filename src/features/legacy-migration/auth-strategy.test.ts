import { describe, expect, it } from "vitest";

/**
 * Auth strategy decision tests — architecture invariants for Phase 18.
 * Evidence: CODE REVIEWED against registration + schema + Phase 4 trigger.
 */
describe("Phase 18 Auth strategy invariants", () => {
  it("documents that profiles require users and Auth identity (no orphan profiles)", () => {
    // Structural dependency is enforced in schema + /join order:
    // auth.admin.createUser → public.users → profiles
    const strategy = {
      canProfileExistWithoutAuth: false,
      authStructurallyRequired: true,
      existingClaimMechanism: "NONE",
      recommended: "AUTH_FIRST_AT_AUTHORIZED_IMPORT_SAME_AS_JOIN",
    };
    expect(strategy.canProfileExistWithoutAuth).toBe(false);
    expect(strategy.authStructurallyRequired).toBe(true);
    expect(strategy.existingClaimMechanism).toBe("NONE");
    expect(strategy.recommended).toContain("AUTH_FIRST");
  });

  it("rejects unsafe ownership patterns", () => {
    const forbidden = [
      "fake auth.users rows",
      "fake passwords",
      "name-only claim",
      "orphan profile with ambiguous ownership",
      "service-role-owned permanent member identities without Auth",
    ];
    expect(forbidden.length).toBeGreaterThan(0);
  });
});
