export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const s = email.trim().toLowerCase();
  const i = s.indexOf("@");
  if (i < 1) return "[invalid-email]";
  return `${s[0]}***@${s[i + 1]}***`;
}

export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  if (d.length < 4) return "[phone]";
  return `***${d.slice(-4)}`;
}

export function maskName(name: string | null | undefined): string {
  if (!name?.trim()) return "[name]";
  return name
    .trim()
    .split(/\s+/)
    .map((p) => `${p[0]}***`)
    .join(" ");
}
