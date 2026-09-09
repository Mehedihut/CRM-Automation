import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/services/**/*.ts", "src/utils/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
      // Baseline thresholds from initial coverage run (commit a2f945a):
      //   lines 53.33% / branches 67.17% / functions 59.32%
      // Set just under those so CI fails if a PR regresses without being
      // hostile on day one. Tighten as we add tests.
      thresholds: {
        lines: 50,
        branches: 60,
        functions: 50,
        statements: 50,
      },
    },
  },
});