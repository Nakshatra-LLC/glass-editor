import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@nakshatra.io/clean-editor/styles.css",
        replacement: resolve(__dirname, "../src/styles.css"),
      },
      {
        find: "@nakshatra.io/clean-editor",
        replacement: resolve(__dirname, "../src/index.ts"),
      },
    ],
    dedupe: ["react", "react-dom", "@tiptap/core", "@tiptap/pm", "@tiptap/react"],
  },
  base: process.env.PAGES_BASE || "/",
});
