import { defineConfig } from "vitest/config";

// Minimal runner for pure functions (classifyAccess and the like) —
// doesn't pull in Next.js/React, doesn't need it. Lives next to the
// source, not in docs/decisions: the choice of vitest as the tool is
// recorded in ADR 0016.
export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
