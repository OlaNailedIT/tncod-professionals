import "server-only";

import { randomUUID } from "node:crypto";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const EXPECTED_ACTION = "registration";
const MAX_TOKEN_LENGTH = 2_048;
const VERIFY_TIMEOUT_MS = 8_000;

type TurnstileResponse = {
  success?: boolean;
  hostname?: string;
  action?: string;
  "error-codes"?: string[];
};

export async function verifyRegistrationCaptcha(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "test") return token === "test-turnstile-token";
    return false;
  }

  const normalizedToken = token.trim();
  if (!normalizedToken || normalizedToken.length > MAX_TOKEN_LENGTH) return false;

  let expectedHostname: string;
  try {
    expectedHostname = new URL(process.env.NEXT_PUBLIC_SITE_URL || "").hostname;
  } catch {
    return false;
  }
  if (!expectedHostname) return false;

  const body = new URLSearchParams({
    secret,
    response: normalizedToken,
    idempotency_key: randomUUID(),
  });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VERIFY_TIMEOUT_MS);
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const result = (await response.json()) as TurnstileResponse;
    return (
      result.success === true &&
      result.hostname === expectedHostname &&
      result.action === EXPECTED_ACTION
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
