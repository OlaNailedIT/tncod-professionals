import "server-only";

import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { getPrisma } from "@/lib/prisma/client";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { trackRegistrationEvent } from "./analytics";
import { verifyRegistrationCaptcha } from "./captcha";
import { findRegistrationDuplicate } from "./duplicate";
import { normalizePhone } from "./phone";
import { checkRegistrationRateLimit } from "./rate-limit";
import { cleanupRegistrationIdentity } from "./registration-cleanup";
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

function neutralAcceptedResult(): RegisterResult {
  return { ok: true, userId: "accepted", profileId: "accepted" };
}

export async function registerProfessional(
  raw: unknown,
  meta: { clientKey: string; deviceClass?: string },
): Promise<RegisterResult> {
  const started = Date.now();

  const rate = await checkRegistrationRateLimit(meta.clientKey);
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

  if (!(await verifyRegistrationCaptcha(data.captchaToken, meta.clientKey))) {
    trackRegistrationEvent("registration_failed", {
      error_category: "captcha",
      device_class: meta.deviceClass,
    });
    return {
      ok: false,
      code: "SPAM",
      message: "Complete the security check and try again.",
    };
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
        phone: "Enter a valid phone or WhatsApp number (include country code if outside Nigeria).",
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
      return neutralAcceptedResult();
    }

    trackRegistrationEvent("registration_auth_started", {
      device_class: meta.deviceClass,
    });

    const admin = createServiceRoleClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {},
      app_metadata: { registration_provisioning: true },
    });

    if (createError || !created.user) {
      const msg = (createError?.message || "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        trackRegistrationEvent("registration_duplicate_detected", {
          error_category: "email",
          device_class: meta.deviceClass,
        });
        return neutralAcceptedResult();
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
    try {
      const prisma = getPrisma();
      // GoTrue may apply app_metadata after the auth.users INSERT. The
      // metadata-update trigger creates the durable obligation in Auth's
      // transaction; this idempotent write is a second application-side guard.
      await prisma.$executeRaw`
        INSERT INTO app.registration_provisioning (user_id)
        VALUES (${userId}::uuid)
        ON CONFLICT (user_id) DO NOTHING
      `;

      const profileId = await prisma.$transaction(async (tx) => {
        // The Auth trigger creates DEACTIVATED + MEMBER. Upsert is a recovery
        // guard if that trigger was temporarily unavailable.
        await tx.user.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email,
            phone: phoneNorm,
            accountStatus: "DEACTIVATED",
          },
          update: { email, phone: phoneNorm },
        });

        const memberRole = await tx.role.findUnique({ where: { name: "MEMBER" } });
        if (!memberRole) throw new Error("MEMBER role is not seeded");
        await tx.userRole.upsert({
          where: { userId_roleId: { userId, roleId: memberRole.id } },
          create: { userId, roleId: memberRole.id },
          update: {},
        });

        const existingProfile = await tx.profile.findUnique({ where: { userId } });
        let completedProfileId = existingProfile?.id;

        if (!completedProfileId) {
          const profile = await tx.profile.create({
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
          completedProfileId = profile.id;
        } else {
          await tx.profile.update({
            where: { id: completedProfileId },
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

        // Removing the durable cleanup obligation and activating the identity
        // share one database commit. If either statement fails, both roll back.
        const cleared = await tx.$executeRaw`
          DELETE FROM app.registration_provisioning
          WHERE user_id = ${userId}::uuid
            AND state = 'PENDING'
            AND lease_token IS NULL
        `;
        if (cleared !== 1) throw new Error("Registration provisioning record is missing");

        await tx.user.update({
          where: { id: userId },
          data: { accountStatus: "ACTIVE" },
        });
        return completedProfileId;
      });

      // Passwordless access is requested from /sign-in after join.
      // Do not auto-send OTP here — built-in Auth email has a low hourly rate limit
      // and a join-time send would burn quota before the member can intentionally sign in.

      const durationMs = data.clientDurationMs ?? Date.now() - started;
      trackRegistrationEvent("registration_completed", {
        result: "ok",
        device_class: meta.deviceClass,
        duration_ms: durationMs,
      });

      return { ok: true, userId, profileId, durationMs };
    } catch (dbError) {
      // The Auth trigger persists a durable cleanup obligation before this
      // request reaches the domain transaction. Attempt it immediately; any
      // failure remains queued for the protected scheduled worker.
      try {
        await cleanupRegistrationIdentity(userId);
      } catch (cleanupError) {
        logger.error("registration_cleanup_immediate_failed", {
          error_category: "cleanup_immediate",
          message: cleanupError instanceof Error ? cleanupError.name : "unknown",
        });
      }
      throw dbError;
    }
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
      return neutralAcceptedResult();
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: "We could not complete registration right now. Please try again shortly.",
    };
  }
}
