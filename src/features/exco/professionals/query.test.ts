import { describe, expect, it } from "vitest";
import {
  EXCO_PROFESSIONALS_PAGE_SIZE,
  excoProfessionalsQueryString,
  parseExcoProfessionalsQuery,
  canViewExcoContactFields,
} from "./query";
import { ROLES } from "@/security/permissions";

describe("Phase 11 EXCO professionals query", () => {
  it("defaults page size constant to 25", () => {
    expect(EXCO_PROFESSIONALS_PAGE_SIZE).toBe(25);
  });

  it("parses domain-named filters without a generic status", () => {
    const q = parseExcoProfessionalsQuery({
      verification: "PENDING",
      visibility: "PRIVATE",
      completion: "incomplete",
      profession: "Engineer",
      businessOwner: "1",
      jobSeeker: "true",
      verified: "1",
      sort: "created_at_desc",
      page: "2",
    });
    expect(q.verificationStatus).toBe("PENDING");
    expect(q.visibilityStatus).toBe("PRIVATE");
    expect(q.completion).toBe("incomplete");
    expect(q.profession).toBe("Engineer");
    expect(q.businessOwner).toBe(true);
    expect(q.jobSeeker).toBe(true);
    expect(q.verifiedProfessional).toBe(true);
    expect(q.sort).toBe("created_at_desc");
    expect(q.page).toBe(2);
  });

  it("ignores invalid completion and sort", () => {
    const q = parseExcoProfessionalsQuery({
      completion: "halfway",
      sort: "hack",
    });
    expect(q.completion).toBe("");
    expect(q.sort).toBe("display_name_asc");
  });

  it("serializes only set filters", () => {
    const s = excoProfessionalsQueryString({
      q: "Ada",
      businessOwner: true,
      page: 1,
      sort: "display_name_asc",
      verificationStatus: "",
      visibilityStatus: "",
      completion: "",
      profession: "",
      industryId: "",
      location: "",
      jobSeeker: false,
      verifiedProfessional: false,
    });
    expect(s).toBe("?q=Ada&businessOwner=1");
  });
});

describe("Phase 11 contact projection", () => {
  it("restricts email/phone to Admin+", () => {
    expect(canViewExcoContactFields([ROLES.EXCO_VIEWER])).toBe(false);
    expect(canViewExcoContactFields([ROLES.MEMBER, ROLES.EXCO_VIEWER])).toBe(false);
    expect(canViewExcoContactFields([ROLES.EXCO_ADMIN])).toBe(true);
    expect(canViewExcoContactFields([ROLES.SUPER_ADMIN])).toBe(true);
  });
});
