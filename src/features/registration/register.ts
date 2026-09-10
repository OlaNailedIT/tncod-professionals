import "server-only";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { trackRegistrationEvent } from "./analytics";
import { DUPLICATE_USER_MESSAGE, findRegistrationDuplicate } from "./duplicate";
import { normalizePhone } from "./phone";
import { checkRegistrationRateLimit } from "./rate-limit";
import { registrationSchema, type RegistrationInput } from "./schema";

export type RegisterResult =
  | { ok: true; userId: string; profileId: string; durationMs?: number }
  | {
      ok: false;
      code: "VALIDATION" | "DUPLICATE" | "RATE_LIMITED" | "SPAM" | "INTERNAL";
      message: string;
      fieldErrors?: Record<string, string>;
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerProfessional(
  raw: unknown,
  meta: { clientKey: string; deviceClass?: string },
): Promise<RegisterResult> {
  const started = Date.now();

  const rate = checkRegistrationRateLimit(meta.clientKey);
  if (!rate.ok) {
    trackRegistrationEvent("registration_failed", {
      error_category: "rate_limited",
      device_class: meta.deviceClass,
    });
    return {
      ok: false,
      code: "RATE_LIMITED",
      message: "Too many attempts. Please wait a few minutes and try again.",
    };
  }

  const parsed = registrationSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    trackRegistrationEvent("registration_validation_failed", {
      error_category: "validation",
      device_class: meta.deviceClass,
    });
    return {
      ok: false,
      code: "VALIDATION",
      message: "Please check the highlighted fields.",
      fieldErrors,
    };
  }

  const data: RegistrationInput = parsed.data;

  // Honeypot: treat as success to bots without creating records.
  if (data.website && data.website.trim().length > 0) {
    trackRegistrationEvent("registration_failed", {
      error_category: "spam",
      device_class: meta.deviceClass,
    });
    return { ok: true, userId: "spam", profileId: "spam" };
  }

  trackRegistrationEvent("registration_submitted", {
    device_class: meta.deviceClass,
    duration_ms: data.clientDurationMs,
  });

  const email = normalizeEmail(data.email);
  const phoneNorm = normalizePhone(data.phone);
  if (!phoneNorm) {
    return {
      ok: false,
      code: "VALIDATION",
      message: "Please check the highlighted fields.",
      fieldErrors: {
        phone: "Enter a valid phone or WhatsApp number (include country code if outside South Africa).",
      },
    };
  }

  try {
    const dup = await findRegistrationDuplicate({ email, phone: data.phone });
    if (dup.duplicate) {
      trackRegistrationEvent("registration_duplicate_detected", {
        error_category: dup.kind,
        device_class: meta.deviceClass,
      });
      return { ok: false, code: "DUPLICATE", message: DUPLICATE_USER_MESSAGE };
    }

    trackRegistrationEvent("registration_auth_started", {
      device_class: meta.deviceClass,
    });

    const admin = createServiceRoleClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {},
      app_metadata: {},
    });

    if (createError || !created.user) {
      const msg = (createError?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        trackRegistrationEvent("registration_duplicate_detected", {
          error_category: "email",
          device_class: meta.deviceClass,
        });
        return { ok: false, code: "DUPLICATE", message: DUPLICATE_USER_MESSAGE };
      }
      logger.error("registration_auth_create_failed", {
        error_category: "auth_create",
        message: createError?.message,
      });
      return {
        ok: false,
        code: "INTERNAL",
        message: "We could not complete registration right now. Please try again shortly.",
      };
    }

    const userId = created.user.id;
    const prisma = getPrisma();

    // Trigger may insert public.users asynchronously relative to Admin API response;
    // upsert identity row then create profile (idempotent).
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email,
        phone: phoneNorm,
      },
      update: {
        email,
        phone: phoneNorm,
      },
    });

    // Ensure MEMBER role if trigger missed (seeded roles required).
    const memberRole = await prisma.role.findUnique({ where: { name: "MEMBER" } });
    if (memberRole) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId, roleId: memberRole.id } },
        create: { userId, roleId: memberRole.id },
        update: {},
      });
    }

    const existingProfile = await prisma.profile.findUnique({ where: { userId } });
    let profileId = existingProfile?.id;

    if (!profileId) {
      const profile = await prisma.profile.create({
        data: {
          userId,
          displayName: data.fullName,
          professionalSituation: data.professionalSituation,
          profileStatus: "REGISTERED",
          verificationStatus: "NOT_REVIEWED",
          visibilityStatus: "PRIVATE",
          professionalDetails: {
            create: {
              profession: data.profession,
              organisationName: data.organisation,
              lookingForSummary: data.lookingFor,
              offeringSummary: data.offering,
              opportunityPreferences: {},
            },
          },
        },
        select: { id: true },
      });
      profileId = profile.id;
    } else {
      await prisma.profile.update({
        where: { id: profileId },
        data: {
          displayName: data.fullName,
          professionalSituation: data.professionalSituation,
          professionalDetails: {
            upsert: {
              create: {
                profession: data.profession,
                organisationName: data.organisation,
                lookingForSummary: data.lookingFor,
                offeringSummary: data.offering,
                opportunityPreferences: {},
              },
              update: {
                profession: data.profession,
                organisationName: data.organisation,
                lookingForSummary: data.lookingFor,
                offeringSummary: data.offering,
              },
            },
          },
        },
      });
    }

    // Passwordless access: send magic link / OTP. Failure must not undo registration.
    try {
      await admin.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });
    } catch (otpError) {
      logger.warn("registration_otp_send_failed", {
        error_category: "otp_send",
        message: otpError instanceof Error ? otpError.message : "unknown",
      });
    }

    const durationMs = data.clientDurationMs ?? Date.now() - started;
    trackRegistrationEvent("registration_completed", {
      result: "ok",
      device_class: meta.deviceClass,
      duration_ms: durationMs,
    });

    return { ok: true, userId, profileId, durationMs };
  } catch (error) {
    logger.error("registration_unexpected", {
      error_category: "unexpected",
      message: error instanceof Error ? error.message : "unknown",
    });
    trackRegistrationEvent("registration_failed", {
      error_category: "unexpected",
      device_class: meta.deviceClass,
    });

    if (error instanceof AppError) {
      return { ok: false, code: "INTERNAL", message: error.message };
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { ok: false, code: "DUPLICATE", message: DUPLICATE_USER_MESSAGE };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: "We could not complete registration right now. Please try again shortly.",
    };
  }
}
