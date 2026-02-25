/// <reference types="vitest/config" />
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repo/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
  optimizeDeps: {
    exclude: ["@repo/ui"], // Ensures local package changes trigger HMR
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  server: {
    host: true, // Listen on all addresses
    proxy: {
      "/api": {
        target: "http://api:4000", // Use the Docker service name
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), // Optional: strip /api prefix
      },
    },
  },
});
