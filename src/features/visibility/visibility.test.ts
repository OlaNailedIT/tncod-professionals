import { describe, expect, it } from "vitest";
import {
  VISIBILITY_GROUPS,
  defaultPreferenceMap,
  isLevelAllowedForGroup,
  preferenceAllowsPublicDirectory,
} from "@/features/visibility/groups";
import { visibilityPreferenceUpsertSchema } from "@/features/visibility/schema";
import { applyVisibilityPreferencesToPublicProfessional } from "@/features/visibility/apply-projection";
import { assertPublicProfessionalShape, type PublicProfessional } from "@/security/projections";

const sample: PublicProfessional = {
  publicSlug: "ada-okafor",
  displayName: "Ada Okafor",
  headline: "Engineer",
  location: "Accra",
  profession: "Software Engineer",
  professionalTitle: "Senior",
  industryName: "Technology",
  skillNames: ["TypeScript"],
  serviceNames: ["Consulting"],
  verifiedBadge: true,
};

describe("Phase 14 visibility matrix", () => {
  it("rejects Public for contact, community, opportunities, business, about, links", () => {
    for (const key of [
      "contact",
      "community",
      "opportunities",
      "business",
      "about",
      "links",
    ] as const) {
      expect(isLevelAllowedForGroup(key, "PUBLIC")).toBe(false);
      const parsed = visibilityPreferenceUpsertSchema.safeParse({
        groupKey: key,
        preference: "PUBLIC",
      });
      expect(parsed.success).toBe(false);
    }
  });

  it("allows Public for identity, professional, skills_services, location", () => {
    for (const key of ["identity", "professional", "skills_services", "location"] as const) {
      expect(isLevelAllowedForGroup(key, "PUBLIC")).toBe(true);
      expect(
        visibilityPreferenceUpsertSchema.safeParse({ groupKey: key, preference: "PUBLIC" })
          .success,
      ).toBe(true);
    }
  });

  it("rejects unknown groups and client identity fields", () => {
    expect(
      visibilityPreferenceUpsertSchema.safeParse({
        groupKey: "documents",
        preference: "PRIVATE",
      }).success,
    ).toBe(false);
    expect(
      visibilityPreferenceUpsertSchema.safeParse({
        groupKey: "identity",
        preference: "PUBLIC",
        profileId: "00000000-0000-0000-0000-000000000001",
      }).success,
    ).toBe(false);
  });

  it("defaults are safe and preferenceAllowsPublicDirectory is PUBLIC-only", () => {
    const defaults = defaultPreferenceMap();
    expect(defaults.contact).toBe("PRIVATE");
    expect(defaults.community).toBe("PRIVATE");
    expect(defaults.identity).toBe("PUBLIC");
    expect(preferenceAllowsPublicDirectory("PUBLIC")).toBe(true);
    expect(preferenceAllowsPublicDirectory("MEMBERS")).toBe(false);
    expect(preferenceAllowsPublicDirectory("PRIVATE")).toBe(false);
  });

  it("withholds public fields when preference is not PUBLIC without adding keys", () => {
    const prefs = defaultPreferenceMap();
    prefs.location = "PRIVATE";
    prefs.skills_services = "MEMBERS";
    prefs.professional = "PRIVATE";
    const out = applyVisibilityPreferencesToPublicProfessional(sample, prefs);
    assertPublicProfessionalShape(out);
    expect(out.location).toBeNull();
    expect(out.skillNames).toEqual([]);
    expect(out.serviceNames).toEqual([]);
    expect(out.profession).toBeNull();
    expect(out.industryName).toBeNull();
    expect(out.displayName).toBe("Ada Okafor");
    expect(out.publicSlug).toBe("ada-okafor");
  });

  it("About Public preference cannot expand Phase 13 allowlist", () => {
    const prefs = defaultPreferenceMap();
    prefs.about = "MEMBERS";
    const out = applyVisibilityPreferencesToPublicProfessional(sample, prefs);
    assertPublicProfessionalShape(out);
    expect("bio" in out).toBe(false);
    expect(VISIBILITY_GROUPS.find((g) => g.key === "about")?.publicFields).toEqual([]);
  });
});
