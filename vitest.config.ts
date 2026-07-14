import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Ten sam alias co w tsconfig (@/* → src/*), żeby testy widziały importy z @/.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Silniki gier testujemy jako czyste funkcje w Node — bez DOM (SPEC §2, Vitest).
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
