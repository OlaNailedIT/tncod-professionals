import { describe, expect, it } from "vitest";
import {
  assertDisposableAuthEnv,
  assertDisposableDatabaseEnv,
  DISPOSABLE_AUTH_OPT_IN,
  DISPOSABLE_DATABASE_PORT,
} from "./disposable-env-gate";

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

describe("disposable database env gate", () => {
  const loopback = `postgresql://postgres:postgres@127.0.0.1:${DISPOSABLE_DATABASE_PORT}/postgres`;

  it("fails closed without opt-in even when the URL is already loopback", () => {
    const check = assertDisposableDatabaseEnv({ DATABASE_URL: loopback });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toContain(DISPOSABLE_AUTH_OPT_IN);
  });

  it("fails closed when opt-in is set and DATABASE_URL is missing", () => {
    const check = assertDisposableDatabaseEnv({ [DISPOSABLE_AUTH_OPT_IN]: "1" });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toContain("DATABASE_URL");
  });

  it("rejects a non-loopback host that is not on a hosted denylist", () => {
    const check = assertDisposableDatabaseEnv({
      [DISPOSABLE_AUTH_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@db.internal.example:54322/postgres",
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toContain("loopback");
  });

  it("rejects loopback on a different port", () => {
    const check = assertDisposableDatabaseEnv({
      [DISPOSABLE_AUTH_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toContain(DISPOSABLE_DATABASE_PORT);
  });

  it("accepts the established loopback target only after opt-in", () => {
    const check = assertDisposableDatabaseEnv({
      [DISPOSABLE_AUTH_OPT_IN]: "1",
      DATABASE_URL: loopback,
    });
    expect(check).toEqual({ ok: true, databaseUrl: loopback });
  });
});
