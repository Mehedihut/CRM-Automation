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
      // Baseline thresholds from the dashboard/whatsapp/team test addition:
      //   lines 78.85% / branches 77.83% / functions 71.01%
      // Set ~3-5 points under the current floor so CI fails on a real
      // regression but isn't hostile on a one-line PR. Tighten as we
      // cover more (controllers/middleware/integrations).
      thresholds: {
        lines: 75,
        branches: 75,
        functions: 70,
        statements: 75,
      },
    },
  },
});