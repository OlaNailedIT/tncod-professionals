/**
 * Phone normalization for identity matching and storage.
 *
 * Platform location: Nigeria (+234).
 * Default country context is NG — not ZA-first.
 *
 * Explicit country codes already present (234…, 27…) are preserved as digits.
 * Local 0-prefixed numbers are interpreted using the selected/default country.
 *
 * Length heuristic (AUTO):
 * - 11 digits starting with 0 → Nigerian local (0 + 10)
 * - 10 digits starting with 0 → not valid NG local; only ZA when country=ZA
 * - 10 digits starting with 7/8/9 → bare Nigerian mobile without leading 0
 */

export type PhoneCountry = "NG" | "ZA" | "AUTO";

/** Product default — TNCOD Professionals operates in Nigeria. */
export const DEFAULT_PHONE_COUNTRY: PhoneCountry = "NG";

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function stripTrunk(digits: string): string {
  if (digits.startsWith("00")) return digits.slice(2);
  return digits;
}

function isPlausibleE164Digits(digits: string): boolean {
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Normalize a Nigerian number to canonical digits with country code (no +).
 * Examples → `2348012345678`:
 * - 08012345678
 * - +234 801 234 5678
 * - 2348012345678
 * - 8012345678
 */
export function normalizeNigerianPhone(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const digits = stripTrunk(digitsOnly(raw));
  if (!digits) return null;

  if (digits.startsWith("234")) {
    return isPlausibleE164Digits(digits) ? digits : null;
  }

  // Local with leading 0: 0 + 10 digits
  if (digits.length === 11 && digits.startsWith("0")) {
    const national = digits.slice(1);
    if (!/^[789]/.test(national)) return null;
    return `234${national}`;
  }

  // Bare national mobile (10 digits, starts 7/8/9)
  if (digits.length === 10 && /^[789]/.test(digits)) {
    return `234${digits}`;
  }

  return null;
}

/**
 * Legacy ZA local normalization — explicit country only.
 * Not the product default.
 */
export function normalizeSouthAfricanPhone(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const digits = stripTrunk(digitsOnly(raw));
  if (!digits) return null;

  if (digits.startsWith("27")) {
    return isPlausibleE164Digits(digits) ? digits : null;
  }

  if (digits.length === 10 && digits.startsWith("0")) {
    return `27${digits.slice(1)}`;
  }

  return null;
}

/**
 * Canonical storage/compare form: digits with country code when recognizable.
 *
 * @param country DEFAULT_PHONE_COUNTRY (`NG`). Pass `ZA` only for explicit ZA input.
 * `AUTO` preserves explicit country prefixes and uses length heuristics for local forms.
 */
export function normalizePhone(
  value: string,
  country: PhoneCountry = DEFAULT_PHONE_COUNTRY,
): string | null {
  const raw = value.trim();
  if (!raw) return null;
  const digits = stripTrunk(digitsOnly(raw));
  if (!digits) return null;

  // Explicit international prefixes — never rewrite across countries.
  if (digits.startsWith("234")) {
    return isPlausibleE164Digits(digits) ? digits : null;
  }
  if (digits.startsWith("27")) {
    return isPlausibleE164Digits(digits) ? digits : null;
  }

  if (country === "NG") {
    return normalizeNigerianPhone(raw);
  }
  if (country === "ZA") {
    return normalizeSouthAfricanPhone(raw);
  }

  // AUTO: length-based local disambiguation
  if (digits.length === 11 && digits.startsWith("0")) {
    return normalizeNigerianPhone(raw);
  }
  if (digits.length === 10 && /^[789]/.test(digits)) {
    return normalizeNigerianPhone(raw);
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return normalizeSouthAfricanPhone(raw);
  }

  if (isPlausibleE164Digits(digits)) return digits;
  return null;
}

export function phonesLikelyMatch(
  a: string,
  b: string,
  country: PhoneCountry = DEFAULT_PHONE_COUNTRY,
): boolean {
  const na = normalizePhone(a, country);
  const nb = normalizePhone(b, country);
  if (!na || !nb) return false;
  return na === nb;
}
