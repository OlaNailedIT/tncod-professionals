import { describe, expect, it } from "vitest";
import { memberNavItems, excoNavItems, excoNavGroups } from "@/components/shell/nav-config";

describe("Phase 5.11 Member vs EXCO differentiation", () => {
  it("keeps Member nav flat and EXCO nav grouped (implemented routes only)", () => {
    expect(memberNavItems.length).toBe(6);
    expect(excoNavItems.length).toBe(7);
    expect(excoNavGroups.length).toBeGreaterThan(1);
  });

  it("keeps Member destinations community-oriented (locked IA + Phase 9 + Phase 13 directory)", () => {
    const labels = memberNavItems.map((i) => i.label);
    expect(labels).toEqual([
      "Dashboard",
      "Directory",
      "Profile",
      "Businesses",
      "Opportunities",
      "Settings",
    ]);
  });

  it("keeps EXCO destinations operational and grouped (implemented routes only)", () => {
    const groupLabels = excoNavGroups.map((g) => g.label);
    expect(groupLabels).toEqual(["Overview", "Manage", "Workflows"]);
    const hrefs = excoNavItems.map((i) => i.href);
    expect(hrefs).toContain("/opportunities");
    expect(hrefs).not.toContain("/exco/directory");
    expect(hrefs).not.toContain("/exco/reports");
    expect(hrefs).not.toContain("/exco/settings");
  });
});
