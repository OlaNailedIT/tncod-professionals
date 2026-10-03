/**
 * Classify Auth errors for safe UI + logs (no secrets/PII).
 */

export type AuthErrorClass =
  | "rate_limit"
  | "user_or_policy"
  | "otp_send"
  | "otp_verify"
  | "callback_exchange"
  | "callback_session"
  | "callback_consumed"
  | "callback_missing"
  | "config"
  | "unknown";

export function classifyAuthErrorMessage(message: string | null | undefined): AuthErrorClass {
  const msg = (message || "").toLowerCase();
  if (!msg) return "unknown";
  if (
    msg.includes("rate limit") ||
    msg.includes("rate_limit") ||
    msg.includes("too many requests") ||
    msg.includes("email rate limit") ||
    msg.includes("over_email_send_rate_limit") ||
    msg.includes("429")
  ) {
    return "rate_limit";
  }
  if (
    msg.includes("signups not allowed") ||
    msg.includes("user not found") ||
    msg.includes("unable to validate email") ||
    msg.includes("email not confirmed")
  ) {
    return "user_or_policy";
  }
  if (msg.includes("otp_expired") || msg.includes("already been used") || msg.includes("token has expired")) {
    return "callback_consumed";
  }
  if (msg.includes("invalid") || msg.includes("expired")) {
    return "otp_verify";
  }
  return "unknown";
}

/**
 * @param codeInputVisible — only mention “enter the code” when the OTP field is on screen.
 */
export function signInRequestUserMessage(
  errorClass: AuthErrorClass,
  options?: { codeInputVisible?: boolean },
): string {
  if (errorClass === "rate_limit") {
    if (options?.codeInputVisible) {
      return "We’ve sent a few sign-in emails recently. Please wait a few minutes before requesting another one. If you already received a code, enter it above.";
    }
    return "We’ve sent a few sign-in emails recently. Please wait a few minutes before requesting another one.";
  }
  return "We could not send a sign-in code right now. Please wait a moment and try again.";
}

export function callbackUserMessage(errorClass: AuthErrorClass): string {
  if (errorClass === "callback_consumed") {
    return "This sign-in link was already used or opened automatically (for example by email security scanning). Enter the one-time code from the same email instead.";
  }
  if (errorClass === "config") {
    return "Sign-in is not configured correctly right now. Please try again shortly.";
  }
  return "That sign-in link is invalid or has expired. Enter the code from your email, or request a new code.";
}

/** Mask email for display: a***@domain.tld */
export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const localMasked = local.length <= 1 ? `${local}***` : `${local[0]}***`;
  return `${localMasked}@${domain}`;
}
