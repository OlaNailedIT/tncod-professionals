import { z } from "zod";
import { PROFESSIONAL_SITUATIONS } from "@/features/registration/schema";
import { OPPORTUNITY_PREF_KEYS } from "@/features/profile/completion";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const preferenceField = z.enum(["", "yes", "no"]).optional().default("");

export const profileEditSchema = z.object({
  displayName: z.string().trim().min(1, "Preferred name is required.").max(120),
  phone: z.string().trim().min(1, "Phone is required.").max(40),
  location: optionalText(120),
  bio: optionalText(800),
  professionalSituation: z.enum(PROFESSIONAL_SITUATIONS, {
    errorMap: () => ({ message: "Select a professional status." }),
  }),
  profession: z.string().trim().min(1, "Profession is required.").max(160),
  organisation: optionalText(160),
  industryId: z.string().optional().default("none"),
  yearsExperience: z.string().trim().optional().default(""),
  skills: optionalText(500),
  services: optionalText(500),
  linkedinUrl: z.string().trim().max(300).optional().default(""),
  serviceArea: optionalText(200),
  lookingFor: z.string().trim().min(1, "This field is required.").max(500),
  offering: z.string().trim().min(1, "This field is required.").max(500),
  collaboration: preferenceField,
  mentorship: preferenceField,
  referrals: preferenceField,
  training: preferenceField,
  claimedUserId: z.string().uuid().optional(),
});

export type ProfileEditValues = z.input<typeof profileEditSchema>;
export type ProfileEditInput = z.output<typeof profileEditSchema>;

export function parseCommaList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .slice(0, 20);
}

export function slugifyTaxonomyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function preferenceToFormValue(value: boolean | null | undefined): "" | "yes" | "no" {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

export function preferenceFromFormValue(value: string | undefined | null): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

export function resolveIndustryId(value: string | undefined | null): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "__none__" || trimmed === "none") return null;
  return trimmed;
}

export function buildOpportunityPreferencesPayload(data: {
  collaboration?: string;
  mentorship?: string;
  referrals?: string;
  training?: string;
}) {
  const payload: Record<string, boolean | null> = {};
  for (const key of OPPORTUNITY_PREF_KEYS) {
    payload[key] = preferenceFromFormValue(data[key]);
  }
  return payload;
}
