import { describe, expect, it } from "vitest";
import { runtimePrismaUrl } from "@/lib/prisma/runtime-url";

const sessionUrl =
  "postgresql://postgres.project:synthetic-password@aws-0-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require";

describe("Vercel Prisma pooler URL", () => {
  it("uses transaction mode and one connection without changing credentials or SSL", () => {
    const result = new URL(runtimePrismaUrl(sessionUrl)!);
    expect(result.hostname).toBe("aws-0-us-west-2.pooler.supabase.com");
    expect(result.port).toBe("6543");
    expect(result.username).toBe("postgres.project");
    expect(result.password).toBe("synthetic-password");
    expect(result.pathname).toBe("/postgres");
    expect(result.searchParams.get("sslmode")).toBe("require");
    expect(result.searchParams.get("pgbouncer")).toBe("true");
    expect(result.searchParams.get("connection_limit")).toBe("1");
  });

  it("adds safe Prisma settings to an existing transaction-pooler URL", () => {
    const result = new URL(runtimePrismaUrl(sessionUrl.replace(":5432/", ":6543/") + "&connection_limit=8&pgbouncer=false")!);
    expect(result.port).toBe("6543");
    expect(result.searchParams.get("pgbouncer")).toBe("true");
    expect(result.searchParams.getAll("pgbouncer")).toEqual(["true"]);
    expect(result.searchParams.getAll("connection_limit")).toEqual(["1"]);
  });

  it("leaves local, direct and unrecognized endpoints untouched", () => {
    for (const url of [
      "postgresql://postgres:fake@127.0.0.1:54322/postgres",
      "postgresql://postgres:fake@db.project.supabase.co:5432/postgres",
      "postgresql://postgres:fake@pooler.supabase.com.evil.example:5432/postgres",
      "postgresql://postgres:fake@aws-0-us-west-2.pooler.supabase.com:1234/postgres",
    ]) {
      expect(runtimePrismaUrl(url)).toBe(url);
    }
    expect(runtimePrismaUrl(undefined)).toBeUndefined();
    expect(runtimePrismaUrl("not a URL")).toBe("not a URL");
  });
});
