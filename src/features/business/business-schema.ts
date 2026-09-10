import { z } from "zod";
import { BusinessProfessionalRelationship } from "@prisma/client";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .optional()
  .default("")
  .transform((v) => (v && v.length > 0 ? v : undefined))
  .refine((v) => v === undefined || isSafeHttpUrl(v), {
    message: "Enter a valid http(s) URL.",
  });

export function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const socialLinksSchema = z.object({
  linkedin: optionalUrl,
  twitter: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
});

export type SocialLinks = z.output<typeof socialLinksSchema>;

export const businessRelationshipSchema = z.nativeEnum(BusinessProfessionalRelationship);

export const businessProfileSchema = z.object({
  name: z.string().trim().min(1, "Business name is required.").max(160),
  industryId: z.string().optional().default("none"),
  description: optionalText(2000),
  location: optionalText(200),
  phone: optionalText(40),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .default("")
    .transform((v) => (v && v.length > 0 ? v : undefined))
    .refine((v) => v === undefined || z.string().email().safeParse(v).success, {
      message: "Enter a valid business email.",
    }),
  websiteUrl: optionalUrl,
  socialLinks: socialLinksSchema.optional().default({}),
  servicesOffered: optionalText(500),
  relationshipType: businessRelationshipSchema.default("OWNER"),
  /** Rejected if client attempts to set privileged status. */
  businessStatus: z.undefined().optional(),
  visibilityStatus: z.undefined().optional(),
  claimedUserId: z.string().uuid().optional(),
  claimedBusinessId: z.string().uuid().optional(),
});

export type BusinessProfileValues = z.input<typeof businessProfileSchema>;
export type BusinessProfileInput = z.output<typeof businessProfileSchema>;

export const businessVerificationSubmitSchema = z.object({
  cacRegistered: z.enum(["yes", "no", "unset"]).default("unset"),
  cacNumber: optionalText(80),
  claimedBusinessId: z.string().uuid().optional(),
  businessStatus: z.undefined().optional(),
});

export type BusinessVerificationSubmitInput = z.output<typeof businessVerificationSubmitSchema>;

export function parseServicesOffered(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 30);
}

export function servicesOfferedToForm(values: string[]): string {
  return values.join(", ");
}

export function resolveIndustryId(value: string | undefined | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "__none__" || trimmed === "none") return null;
  return trimmed;
}

export function emptySocialLinks(): SocialLinks {
  return {
    linkedin: undefined,
    twitter: undefined,
    facebook: undefined,
    instagram: undefined,
  };
}

export function parseSocialLinks(raw: unknown): SocialLinks {
  const parsed = socialLinksSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : emptySocialLinks();
}

export function slugifyBusinessName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const ALLOWED_BUSINESS_DOCUMENT_TYPES = [
  "BUSINESS_REGISTRATION",
  "PROFESSIONAL_CERTIFICATE",
  "OTHER",
] as const;

export type AllowedBusinessDocumentType = (typeof ALLOWED_BUSINESS_DOCUMENT_TYPES)[number];

export const MAX_BUSINESS_DOCUMENT_BYTES = 10 * 1024 * 1024;

export const ALLOWED_DOCUMENT_MIME: Record<string, readonly string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export function extensionForFileName(fileName: string): string {
  const i = fileName.lastIndexOf(".");
  if (i < 0) return "";
  return fileName.slice(i).toLowerCase();
}

export function sniffDocumentMime(bytes: Uint8Array): string | null {
  if (bytes.length >= 4) {
    // %PDF
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return "application/pdf";
    }
    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return "image/png";
    }
    // JPEG
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
  }
  return null;
}
