import { describe, expect, it } from "vitest";
import { PERMISSIONS, ROLE_PERMISSION_KEYS } from "@/security/permissions";

describe("opportunity.manage catalogue", () => {
  it("grants create to EXCO_ADMIN and SUPER_ADMIN only", () => {
    expect(ROLE_PERMISSION_KEYS.MEMBER).not.toContain(PERMISSIONS.OPPORTUNITY_MANAGE);
    expect(ROLE_PERMISSION_KEYS.EXCO_VIEWER).not.toContain(PERMISSIONS.OPPORTUNITY_MANAGE);
    expect(ROLE_PERMISSION_KEYS.EXCO_ADMIN).toContain(PERMISSIONS.OPPORTUNITY_MANAGE);
    expect(ROLE_PERMISSION_KEYS.SUPER_ADMIN).toContain(PERMISSIONS.OPPORTUNITY_MANAGE);
  });
});
