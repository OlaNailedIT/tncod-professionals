import { z } from "zod";

const unwrapQuotes = (value: unknown) => {
  if (typeof value !== "string") return value;
  let current = value.trim();
  while (
    (current.startsWith('"') && current.endsWith('"') && current.length >= 2) ||
    (current.startsWith("'") && current.endsWith("'") && current.length >= 2)
  ) {
    current = current.slice(1, -1);
  }
  return current === "" ? undefined : current;
};

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(unwrapQuotes, z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(unwrapQuotes, z.string().min(1).optional()),
});

export type PublicEnv = z.infer<typeof publicSchema>;

function assertNoLeakedServiceRole(): void {
  if (process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY is forbidden");
  }
}

/** Browser-safe env. Missing values stay undefined — never invented. */
export function getPublicEnv(): PublicEnv {
  assertNoLeakedServiceRole();
  return publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function hasBrowserSupabaseConfig(): boolean {
  const env = getPublicEnv();
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
