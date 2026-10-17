import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSessionSupabaseConfig } from "./supabase-session";
import { getPublicEnv } from "./public";

const url = "https://hyzkearnbhxznkeokacj.supabase.co";
const key = "sb_publishable_test_sentinel_not_a_live_key";
const names = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_AUTH_SERVER_ONLY", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_SECRET_KEY"];
beforeEach(() => names.forEach(name => vi.stubEnv(name, undefined)));
afterEach(() => vi.unstubAllEnvs());
function privateConfig() {
  vi.stubEnv("SUPABASE_AUTH_SERVER_ONLY", "1");
  vi.stubEnv("SUPABASE_URL", url);
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", key);
}
describe("session-scoped Supabase configuration", () => {
  it("keeps an unconfigured legacy deployment unconfigured", () => {
    expect(getSessionSupabaseConfig()).toBeNull();
  });
  it("preserves legacy configuration without an environment cutover", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `"${url}"`);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "'test-legacy-anon'");
    expect(getSessionSupabaseConfig()).toEqual({url, key:"test-legacy-anon"});
  });
  it("supports strict server-only configuration without public Auth keys", () => {
    privateConfig();
    expect(getSessionSupabaseConfig()).toEqual({url,key});
    expect(JSON.stringify(getPublicEnv())).not.toContain(key);
  });
  it.each(["NEXT_PUBLIC_SUPABASE_ANON_KEY", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"])("rejects browser key exposure in strict mode: %s", name => {
    privateConfig(); vi.stubEnv(name,"exposed");
    expect(() => getSessionSupabaseConfig()).toThrow(/browser-exposed/);
  });
  it("fails closed when strict private configuration is missing", () => {
    privateConfig(); vi.stubEnv("SUPABASE_PUBLISHABLE_KEY",undefined);
    expect(() => getSessionSupabaseConfig()).toThrow(/incomplete/);
  });
  it.each(["sb_secret_not_allowed", "legacy-jwt-not-a-publishable-key"])("rejects a non-publishable private session key: %s", value => {
    privateConfig(); vi.stubEnv("SUPABASE_PUBLISHABLE_KEY",value);
    expect(() => getSessionSupabaseConfig()).toThrow(/low-privilege/);
  });
  it("rejects a privileged JWT even in legacy configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL",url);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY",`e30.${btoa(JSON.stringify({role:"service_role"}))}.signature`);
    expect(() => getSessionSupabaseConfig()).toThrow(/Privileged/);
  });
  it.each(["NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_SECRET_KEY"])("preserves privileged-key exposure guard: %s", name => {
    privateConfig(); vi.stubEnv(name,"forbidden");
    expect(() => getSessionSupabaseConfig()).toThrow(/forbidden/);
  });
  it("rejects non-HTTP provider URLs without echoing configuration", () => {
    privateConfig(); vi.stubEnv("SUPABASE_URL","file:///not-allowed");
    expect(() => getSessionSupabaseConfig()).toThrow(/valid HTTP/);
  });
});
