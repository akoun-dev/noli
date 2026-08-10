import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/components/ui/**",
        "src/types/**",
        "src/test-setup.ts",
        "**/*.d.ts",
      ],
      // Seuils appliqués quand la couverture est activée (CI : `vitest run --coverage`).
      thresholds: {
        // Plancher global anti-régression. L'UI n'est pas encore couverte ;
        // à REMONTER au fur et à mesure que les tests s'étoffent.
        statements: 5,
        branches: 5,
        functions: 3,
        lines: 5,
        // Exigence réelle sur la logique métier (src/lib). À ratcheter vers le haut.
        "src/lib/**": {
          statements: 38,
          branches: 40,
          functions: 45,
          lines: 38,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
