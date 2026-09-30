/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relativ, damit die Seite unter GitHub Pages in einem Unterordner läuft.
  base: "./",
  plugins: [react()],
  test: {
    globals: true,
    setupFiles: ["app/tests/setup.ts"],
    environment: "node",
    environmentMatchGlobs: [["app/**", "jsdom"]],
  },
});
