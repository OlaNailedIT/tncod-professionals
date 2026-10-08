import { describe, expect, it } from "vitest";
import { assertDisposableAuthEnv, DISPOSABLE_AUTH_OPT_IN } from "./disposable-env-gate";

describe("disposable Auth env gate", () => {
  it("fails closed without opt-in", () => {
    const check = assertDisposableAuthEnv({
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY: "test",
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toContain(DISPOSABLE_AUTH_OPT_IN);
  });

  it("rejects hosted Supabase URL even with opt-in", () => {
    const check = assertDisposableAuthEnv({
      [DISPOSABLE_AUTH_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "https://brpppukzqgpzxjelwwrj.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test",
    });
    expect(check.ok).toBe(false);
  });

  it("rejects non-loopback DATABASE_URL", () => {
    const check = assertDisposableAuthEnv({
      [DISPOSABLE_AUTH_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@db.example.com:5432/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY: "test",
    });
    expect(check.ok).toBe(false);
  });

  it("accepts loopback DB + Auth with opt-in", () => {
    const check = assertDisposableAuthEnv({
      [DISPOSABLE_AUTH_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      SUPABASE_SERVICE_ROLE_KEY: "local-service-role",
    });
    expect(check.ok).toBe(true);
  });
});
