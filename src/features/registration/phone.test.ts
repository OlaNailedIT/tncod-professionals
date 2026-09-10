import { describe, expect, it } from "vitest";
import {
  DEFAULT_PHONE_COUNTRY,
  normalizeNigerianPhone,
  normalizePhone,
  normalizeSouthAfricanPhone,
  phonesLikelyMatch,
} from "@/features/registration/phone";

describe("phone normalization — Nigeria default", () => {
  it("defaults country context to NG", () => {
    expect(DEFAULT_PHONE_COUNTRY).toBe("NG");
  });

  it("normalizes common Nigerian local formats", () => {
    expect(normalizePhone("08012345678")).toBe("2348012345678");
    expect(normalizePhone("08112345678")).toBe("2348112345678");
    expect(normalizePhone("07012345678")).toBe("2347012345678");
    expect(normalizePhone("09012345678")).toBe("2349012345678");
    expect(normalizePhone("09112345678")).toBe("2349112345678");
  });

  it("normalizes +234 and 234 international forms", () => {
    expect(normalizePhone("+234 801 234 5678")).toBe("2348012345678");
    expect(normalizePhone("+2348012345678")).toBe("2348012345678");
    expect(normalizePhone("2348012345678")).toBe("2348012345678");
    expect(normalizePhone("234 80 1234 5678")).toBe("2348012345678");
  });

  it("handles whitespace, parentheses, hyphens", () => {
    expect(normalizePhone("(080) 123-45678")).toBe("2348012345678");
    expect(normalizePhone("0801-234-5678")).toBe("2348012345678");
    expect(normalizePhone("  08012345678  ")).toBe("2348012345678");
  });

  it("accepts bare 10-digit national mobiles", () => {
    expect(normalizePhone("8012345678")).toBe("2348012345678");
  });

  it("is idempotent for valid values", () => {
    const once = normalizePhone("08012345678");
    expect(once).toBeTruthy();
    expect(normalizePhone(once!)).toBe(once);
    expect(normalizePhone(normalizePhone("+2348012345678")!)).toBe("2348012345678");
  });

  it("rejects empty, junk, and invalid NG local shapes", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
    expect(normalizeNigerianPhone("0123456789")).toBeNull(); // not 7/8/9 national
    expect(normalizePhone("0821234567")).toBeNull(); // 10-digit 0-prefix is not NG local
  });

  it("phonesLikelyMatch under NG default", () => {
    expect(phonesLikelyMatch("08012345678", "+2348012345678")).toBe(true);
    expect(phonesLikelyMatch("08012345678", "08112345678")).toBe(false);
  });
});

describe("phone normalization — must not ZA-corrupt Nigerian locals", () => {
  it("does not map Nigerian 11-digit local to 27…", () => {
    const n = normalizePhone("08143395949");
    expect(n).toBe("2348143395949");
    expect(n?.startsWith("27")).toBe(false);
  });

  it("preserves explicit +27 without rewriting to 234", () => {
    expect(normalizePhone("+27 82 123 4567")).toBe("27821234567");
    expect(normalizePhone("27821234567")).toBe("27821234567");
  });

  it("ZA local only when country=ZA explicitly", () => {
    expect(normalizePhone("0821234567", "ZA")).toBe("27821234567");
    expect(normalizeSouthAfricanPhone("0821234567")).toBe("27821234567");
    expect(normalizePhone("0821234567", "NG")).toBeNull();
  });

  it("AUTO uses length heuristic: 11-digit 0→NG, 10-digit 0→ZA", () => {
    expect(normalizePhone("08012345678", "AUTO")).toBe("2348012345678");
    expect(normalizePhone("0821234567", "AUTO")).toBe("27821234567");
  });
});
