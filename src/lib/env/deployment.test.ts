import { describe, expect, it } from "vitest";
import { isProductionDeployment } from "./deployment";

describe("production-only surface restrictions", () => {
  it.each([
    { VERCEL_ENV: "production" },
    { CONTEXT: "production" },
    { VERCEL_ENV: "production", CONTEXT: "deploy-preview" },
    { VERCEL_ENV: "preview", CONTEXT: "production" },
  ])("keeps the laboratory hidden for production context %j", (env) => {
    expect(isProductionDeployment(env)).toBe(true);
  });

  it.each([
    {},
    { VERCEL_ENV: "preview" },
    { CONTEXT: "deploy-preview" },
    { CONTEXT: "branch-deploy" },
  ])("preserves local and preview access for %j", (env) => {
    expect(isProductionDeployment(env)).toBe(false);
  });
});
