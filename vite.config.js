import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  plugins: [react()],
  base,
  test: {
    environment: "jsdom",
    setupFiles: "./vitest.setup.js",
    globals: true,
  },
});
