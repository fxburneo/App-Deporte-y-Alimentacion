import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Pruebas automaticas. La logica pura corre en node; las pantallas
// (archivos .test.tsx) corren en jsdom, un navegador simulado.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
  },
});
