import "server-only";

const SENSITIVE = /password|secret|token|authorization|service_role|database_url|direct_url/i;

function redact(value: unknown): unknown {
  if (typeof value === "string" && SENSITIVE.test(value)) {
    return "[redacted]";
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE.test(k) ? "[redacted]" : redact(v);
    }
    return out;
  }
  return value;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(JSON.stringify({ level: "info", message, meta: meta ? redact(meta) : undefined }));
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(JSON.stringify({ level: "warn", message, meta: meta ? redact(meta) : undefined }));
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(JSON.stringify({ level: "error", message, meta: meta ? redact(meta) : undefined }));
  },
};
