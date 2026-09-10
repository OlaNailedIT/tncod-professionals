import { describe, expect, it } from "vitest";
import {
  assertPublicProfessionalShape,
  NEVER_IN_PUBLIC_OR_DIRECTORY,
  PublicProfessionalFields,
  type PublicProfessional,
} from "@/security/projections";

describe("PublicProfessional allowlist", () => {
  it("includes Phase 13 facets and rejects forbidden keys", () => {
    expect(PublicProfessionalFields).toContain("industryName");
    expect(PublicProfessionalFields).toContain("skillNames");
    expect(PublicProfessionalFields).toContain("serviceNames");
    expect(NEVER_IN_PUBLIC_OR_DIRECTORY).toContain("email");
    expect(NEVER_IN_PUBLIC_OR_DIRECTORY).toContain("phone");

    const ok: PublicProfessional = {
      publicSlug: "ada-lovelace",
      displayName: "Ada",
      headline: null,
      location: "Lagos",
      profession: "Engineer",
      professionalTitle: null,
      industryName: "Technology",
      skillNames: ["TypeScript"],
      serviceNames: ["Mentoring"],
      verifiedBadge: true,
    };
    expect(() => assertPublicProfessionalShape(ok)).not.toThrow();
    expect(() =>
      assertPublicProfessionalShape({ ...ok, email: "secret@example.com" }),
    ).toThrow(/unauthorized|forbidden/i);
  });
});
