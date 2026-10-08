/**
 * Public join-success copy shared by the page and tests.
 * Must stay truthful for genuine create AND intentional neutral accepts
 * (duplicate, soft-deleted collision, honeypot) without revealing which path ran.
 */
export const JOIN_SUCCESS_HEADING = "Request received";

export const JOIN_SUCCESS_LEAD =
  "If this email can join TNCOD Professionals, your record is ready with private defaults. Joining does not verify you or list you in the public directory.";

export const JOIN_SUCCESS_NEXT_TITLE = "What to do next";

/** Established Professionals contact (SMTP sender). Public support route — not an existence oracle. */
export const JOIN_SUCCESS_SUPPORT_EMAIL = "cityofdavidprofessionals@gmail.com";

export const JOIN_SUCCESS_SUPPORT_HREF = `mailto:${JOIN_SUCCESS_SUPPORT_EMAIL}?subject=${encodeURIComponent("TNCOD Professionals — sign-in code help")}`;

export const JOIN_SUCCESS_NEXT_BODY =
  "Use Sign in with the same email to request a one-time code. Registration does not sign you in and does not send a code by itself. If no code arrives after one Sign in request, stop retrying and email cityofdavidprofessionals@gmail.com with the address you used — do not assume a new account was created from this page alone.";
