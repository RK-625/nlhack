import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = import.meta.dirname;

// Multi-page build: each page is its own HTML entry, so `/` and `/judges/`
// are real files on any static host (no rewrite rules needed).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    rolldownOptions: {
      input: {
        home: resolve(root, "index.html"),
        judges: resolve(root, "judges/index.html"),
      },
    },
  },
  server: { port: 5180 },
});
