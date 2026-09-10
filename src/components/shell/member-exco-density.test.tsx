import { describe, expect, it } from "vitest";
import { memberNavItems, excoNavItems, excoNavGroups } from "@/components/shell/nav-config";

describe("Phase 5.11 Member vs EXCO differentiation", () => {
  it("keeps Member navigation leaner than EXCO operational destinations", () => {
    expect(memberNavItems.length).toBeLessThan(excoNavItems.length);
    expect(memberNavItems.length).toBe(6);
    expect(excoNavGroups.length).toBeGreaterThan(1);
    expect(excoNavItems.length).toBe(8);
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

  it("keeps EXCO destinations operational and grouped (locked IA)", () => {
    const groupLabels = excoNavGroups.map((g) => g.label);
    expect(groupLabels).toEqual(["Overview", "Manage", "Workflows", "Insights", "System"]);
  });
});
