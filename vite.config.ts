import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Proxy API calls to avoid CORS issues when backend is on ngrok
    proxy: {
      "/auth": {
        target: "https://d387-115-96-27-193.ngrok-free.app",
        changeOrigin: true,
        secure: true,
      },
      "/doc": {
        target: "https://d387-115-96-27-193.ngrok-free.app",
        changeOrigin: true,
        secure: true,
      },
      "/chat": {
        target: "https://d387-115-96-27-193.ngrok-free.app",
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
