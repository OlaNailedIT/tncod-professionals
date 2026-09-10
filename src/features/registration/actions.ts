"use server";

import { headers } from "next/headers";
import { registerProfessional, type RegisterResult } from "@/features/registration/register";
import { trackRegistrationEvent } from "@/features/registration/analytics";

function clientKeyFromHeaders(h: Headers): string {
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return h.get("x-real-ip") || "unknown";
}

export async function submitRegistrationAction(raw: unknown): Promise<RegisterResult> {
  trackRegistrationEvent("registration_started");
  const h = await headers();
  return registerProfessional(raw, {
    clientKey: clientKeyFromHeaders(h),
    deviceClass: h.get("sec-ch-ua-mobile") === "?1" ? "mobile" : "desktop",
  });
}
