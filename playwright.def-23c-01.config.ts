import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Targeted DEF-23C-01 browser matrix — local webServer only.
 * Does not hit Production and does not create accounts.
 */

function loadEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const root = process.cwd();
const localEnv = {
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.local")),
  // Local disposable DB for directory page render. Values stay out of git.
  ...loadEnvFile(path.join(root, "..", "tncod-professional", ".env")),
  ...loadEnvFile(path.join(root, "..", "tncod-professional", ".env.local")),
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/def-23c-01-mobile-menu.spec.ts",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60_000,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "webkit-iphone",
      use: { ...devices["iPhone 12 Pro"] },
    },
    {
      name: "chromium-phone",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "webkit-ipad",
      use: { ...devices["iPad Pro 11"] },
    },
    {
      // Built-in landscape preset is 750×340, below the md header breakpoint.
      // Viewport is set with the context so the header is on screen at the
      // physical iPhone 12 Pro landscape width, without a later resize.
      name: "webkit-iphone-landscape",
      use: {
        ...devices["iPhone 12 Pro landscape"],
        viewport: { width: 844, height: 390 },
      },
    },
    {
      name: "chromium-ipad",
      use: { ...devices["iPad Pro 11"] },
    },
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      ...localEnv,
      AUTH_E2E_HELPER: process.env.AUTH_E2E_HELPER ?? "1",
    },
  },
});
