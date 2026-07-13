import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Silniki gier testujemy jako czyste funkcje w Node — bez DOM (SPEC §2, Vitest).
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
