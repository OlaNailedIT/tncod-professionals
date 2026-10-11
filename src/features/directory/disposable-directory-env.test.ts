import { describe, expect, it } from "vitest";
import {
  PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN,
  assertDisposableDirectoryTestEnv,
} from "@/features/directory/disposable-directory-env";

describe("assertDisposableDirectoryTestEnv", () => {
  it("fails closed without opt-in", () => {
    const check = assertDisposableDirectoryTestEnv({
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.reason).toContain(PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN);
  });

  it("fails closed for non-loopback or wrong port", () => {
    const remote = assertDisposableDirectoryTestEnv({
      [PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@db.example.com:54322/postgres",
    });
    expect(remote.ok).toBe(false);

    const wrongPort = assertDisposableDirectoryTestEnv({
      [PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:5432/postgres",
    });
    expect(wrongPort.ok).toBe(false);

    const prodMarker = assertDisposableDirectoryTestEnv({
      [PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres?options=brpppukzqgpzxjelwwrj",
    });
    expect(prodMarker.ok).toBe(false);
  });

  it("accepts disposable loopback 54322 with opt-in", () => {
    const check = assertDisposableDirectoryTestEnv({
      [PHASE6R_DISPOSABLE_DIRECTORY_OPT_IN]: "1",
      DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    });
    expect(check).toEqual({
      ok: true,
      host: "127.0.0.1",
      port: 54322,
      database: "postgres",
    });
  });
});
