import { defineConfig } from "vite";
import path from "path";
import viteReact from "@vitejs/plugin-react";
// Note: @tailwindcss/vite isn't required for Tailwind v3 setup

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
});
