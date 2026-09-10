import "server-only";

import { z } from "zod";
import { getPublicEnv } from "./public";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const serverSchema = z.object({
  DATABASE_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  DIRECT_URL: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess((value) => {
    if (typeof value !== "string") return emptyToUndefined(value);
    let current = value.trim();
    while (
      (current.startsWith('"') && current.endsWith('"') && current.length >= 2) ||
      (current.startsWith("'") && current.endsWith("'") && current.length >= 2)
    ) {
      current = current.slice(1, -1);
    }
    return emptyToUndefined(current);
  }, z.string().min(1).optional()),
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;

export function getServerEnv(): ServerEnv {
  getPublicEnv();
  return serverSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
}

export function requireDatabaseUrl(): string {
  const url = getServerEnv().DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for this operation");
  }
  return url;
}

export function requireServiceRoleKey(): string {
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for this operation");
  }
  return key;
}
