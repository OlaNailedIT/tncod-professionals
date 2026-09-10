import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv } from "./public";

describe("public env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("forbids service role on NEXT_PUBLIC", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "leak");
    expect(() => getPublicEnv()).toThrow(/forbidden/);
  });

  it("accepts missing supabase public config", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });

  it("unwraps nested quotes around the public URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", '""http://127.0.0.1:54321""');
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-test-key");
    expect(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
  });
});
