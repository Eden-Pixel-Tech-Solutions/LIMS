import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname), // 🔥 important
  base: './', // 🔥 EXTREMELY important for Electron file:// protocol
  plugins: [react()],
  resolve: {
    alias: {
      "lucide-react": path.resolve(__dirname, "../node_modules/lucide-react"),
    },
  },
  server: {
    port: 5173,
    fs: {
      allow: [
        path.resolve(__dirname, ".."),
      ],
    },
  },
});