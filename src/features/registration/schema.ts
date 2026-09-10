import { z } from "zod";

/** Controlled professional-situation options mapped to free-text `profiles.professional_situation`. */
export const PROFESSIONAL_SITUATIONS = [
  "Employee",
  "Entrepreneur / business owner",
  "Freelancer / consultant",
  "Skilled professional",
  "Student / intern",
  "Job seeker",
  "Between roles",
  "Retired professional",
  "Career transition",
  "Other",
] as const;

export type ProfessionalSituation = (typeof PROFESSIONAL_SITUATIONS)[number];

const trimmed = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "This field is required.")
    .max(max, `Keep this under ${max} characters.`);

export const registrationSchema = z.object({
  fullName: trimmed(120),
  phone: trimmed(40),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address.")
    .max(254),
  professionalSituation: z.enum(PROFESSIONAL_SITUATIONS, {
    errorMap: () => ({ message: "Select a professional status." }),
  }),
  profession: trimmed(160),
  organisation: z
    .string()
    .trim()
    .max(160, "Keep this under 160 characters.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  lookingFor: trimmed(500),
  offering: trimmed(500),
  /** Honeypot — must stay empty. */
  website: z.string().max(200).optional().default(""),
  /** Client-measured ms since form open — KPI instrumentation only. */
  clientDurationMs: z.coerce.number().int().nonnegative().max(3_600_000).optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
