import { describe, expect, it } from "vitest";
import {
  businessProfileSchema,
  isSafeHttpUrl,
  parseServicesOffered,
  sniffDocumentMime,
} from "./business-schema";

describe("business schema validation", () => {
  it("requires name and accepts structured social URLs", () => {
    const ok = businessProfileSchema.safeParse({
      name: "Ada Labs",
      websiteUrl: "https://ada.example",
      socialLinks: { linkedin: "https://linkedin.com/company/ada" },
      email: "hello@ada.example",
    });
    expect(ok.success).toBe(true);
  });

  it("rejects unsafe or non-http URLs", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("ftp://files.example")).toBe(false);
    expect(isSafeHttpUrl("https://ok.example")).toBe(true);
    const bad = businessProfileSchema.safeParse({
      name: "X",
      websiteUrl: "javascript:alert(1)",
    });
    expect(bad.success).toBe(false);
  });

  it("rejects client-supplied privileged status fields", () => {
    const parsed = businessProfileSchema.safeParse({
      name: "X",
      businessStatus: "APPROVED",
    });
    expect(parsed.success).toBe(false);
  });

  it("parses services list", () => {
    expect(parseServicesOffered("Consulting, Training, ")).toEqual(["Consulting", "Training"]);
  });

  it("sniffs PDF/PNG/JPEG magic bytes", () => {
    expect(sniffDocumentMime(new Uint8Array([0x25, 0x50, 0x44, 0x46]))).toBe("application/pdf");
    expect(sniffDocumentMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe("image/png");
    expect(sniffDocumentMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe("image/jpeg");
    expect(sniffDocumentMime(new Uint8Array([0x00, 0x00]))).toBeNull();
  });
});
