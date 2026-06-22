import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
// The demo imports the library SOURCE (alias below), which references the
// build-time `__PKG_VERSION__` define. Consumers get it from the built dist,
// but the source-aliased demo must define it here too (root package.json).
import libPkg from "../package.json";

// GitHub Pages' configure-pages outputs base_path WITHOUT a trailing slash
// (e.g. "/clean-editor"). Vite's `import.meta.env.BASE_URL` is used as a raw
// prefix for runtime asset URLs, so it MUST end in "/" or paths like
// `${BASE_URL}appicon.svg` collapse to "/clean-editorappicon.svg". Normalize it.
const rawBase = process.env.PAGES_BASE || "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

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
  define: { __PKG_VERSION__: JSON.stringify(libPkg.version) },
  base,
});
