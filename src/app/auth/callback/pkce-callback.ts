import { sanitizeNextPath } from "@/lib/auth/safe-redirect";

const INVALID_CALLBACK_MESSAGE = "That sign-in link is invalid or has expired.";

type CallbackSearchParams = Pick<URLSearchParams, "get">;
type ExchangeCode = (code: string) => Promise<{ error: unknown | null }>;

export type PkceCallbackResult =
  | { ok: true; next: string }
  | { ok: false; message: string };

/**
 * Complete only a PKCE callback that is bound to the verifier created when the
 * sign-in request began. URL-fragment access/refresh tokens are intentionally
 * unsupported because they are not correlated to that browser transaction.
 */
export async function completePkceCallback(
  searchParams: CallbackSearchParams,
  exchangeCode: ExchangeCode,
): Promise<PkceCallbackResult> {
  const code = searchParams.get("code");
  if (!code) {
    return { ok: false, message: INVALID_CALLBACK_MESSAGE };
  }

  const { error } = await exchangeCode(code);
  if (error) {
    return { ok: false, message: INVALID_CALLBACK_MESSAGE };
  }

  return {
    ok: true,
    next: sanitizeNextPath(searchParams.get("next")),
  };
}
