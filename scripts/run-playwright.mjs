/**
 * Run Playwright with a project-local browser cache.
 *
 * Cursor agent shells may inject PLAYWRIGHT_BROWSERS_PATH into a disposable
 * Temp sandbox cache. That package-install ≠ browser-install gap caused page-
 * based tests to fail while request-based smoke still passed.
 *
 * This wrapper pins browsers under `.cache/ms-playwright` (gitignored) so
 * install + test share one durable location for this repository.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const browsersPath = path.join(root, ".cache", "ms-playwright");
fs.mkdirSync(browsersPath, { recursive: true });

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-playwright.mjs <playwright-args...>");
  process.exit(1);
}

const env = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH: browsersPath,
  AUTH_E2E_HELPER: process.env.AUTH_E2E_HELPER ?? "1",
};

const result = spawnSync("npx", ["playwright", ...args], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
