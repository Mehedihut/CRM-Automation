/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/components/**/*.tsx", "src/pages/**/*.tsx"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/main.tsx", "src/config.ts"],
      // Baseline thresholds from initial coverage run (commit a2f945a):
      //   lines ~14% (only a few pages have tests) /
      //   branches 79% / functions 60%
      // Lines threshold is intentionally low until more page tests land.
      // Tighten as we add tests.
      thresholds: {
        lines: 12,
        branches: 70,
        functions: 30,
        statements: 12,
      },
    },
  },
});