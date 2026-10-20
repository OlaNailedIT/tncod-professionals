import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "launch-four-corrections.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  use: {
    baseURL: "http://127.0.0.1:3116",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 844 } } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 834, height: 1194 } } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3116",
    url: "http://127.0.0.1:3116",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
