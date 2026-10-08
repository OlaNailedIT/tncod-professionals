import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Integration boundary tests hit DATABASE_URL; keep sequential to avoid fixture races.
    fileParallelism: false,
    // Disposable DB under suite load can exceed the 5s default for boundary tests.
    testTimeout: 30_000,
  },
  esbuild: {
    // Match Next/automatic JSX so components that only type-import React still render in Vitest.
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      // Test-only: allow importing server command modules under Vitest without changing production.
      "server-only": path.resolve(rootDir, "./scripts/vitest-server-only-shim.cjs"),
    },
  },
});
