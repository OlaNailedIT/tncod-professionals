import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 20 authenticated evidence — dedicated port so a reused :3000
 * production server (without AUTH_E2E_HELPER) cannot starve the helper.
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: /phase-20.*\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3001",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev -- --port 3001",
    url: "http://127.0.0.1:3001",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      AUTH_E2E_HELPER: "1",
      PORT: "3001",
    },
  },
});
