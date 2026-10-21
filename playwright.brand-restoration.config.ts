import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  use: { baseURL: "http://127.0.0.1:3116", trace: "retain-on-failure" },
  projects: [
    ...[320, 375, 390, 430, 768, 834, 1024, 1280].map((width) => ({
      name: `brand-${width}`, testMatch: "brand-restoration.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width, height: 900 } },
    })),
    { name: "brand-webkit-phone", testMatch: "brand-restoration.spec.ts", use: { ...devices["iPhone 12 Pro"], browserName: "webkit" } },
    { name: "brand-showcase", testMatch: "brand-restoration-showcase.spec.ts", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    ...[320, 834, 1280].map((width) => ({
      name: `previous-corrections-${width}`, testMatch: "launch-four-corrections.spec.ts",
      use: { ...devices["Desktop Chrome"], viewport: { width, height: 900 } },
    })),
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3116",
    url: "http://127.0.0.1:3116", reuseExistingServer: false, timeout: 45_000,
  },
});
