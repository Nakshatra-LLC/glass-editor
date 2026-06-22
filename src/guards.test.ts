/**
 * Architecture guard tests for @nakshatra/glass-editor.
 *
 * These tests enforce the four invariants documented in AGENTS.md
 * § "Guarded patterns (do not break)". If a test here fails, you
 * changed a contract visible to consumers — update the test AND
 * explain why in your PR.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";

const ROOT = resolve(__dirname, "..");

// ---------------------------------------------------------------------------
// 1. Peer-dependency singletons
// ---------------------------------------------------------------------------
test("peer-dependency singletons: required keys present and absent from dependencies", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

  const REQUIRED_PEERS = [
    "react",
    "react-dom",
    "@tiptap/core",
    "@tiptap/pm",
    "@tiptap/react",
  ] as const;

  const peers = Object.keys(pkg.peerDependencies ?? {});
  const deps = Object.keys(pkg.dependencies ?? {});

  // Assert every required peer is declared
  for (const p of REQUIRED_PEERS) {
    expect(peers).toContain(p);
  }

  // Assert no extra keys beyond the required set
  const extraPeers = peers.filter((k) => !REQUIRED_PEERS.includes(k as (typeof REQUIRED_PEERS)[number]));
  expect(extraPeers).toEqual([]);

  // Assert none of the five peers also appear in regular dependencies
  for (const p of REQUIRED_PEERS) {
    expect(deps).not.toContain(p);
  }
});

// ---------------------------------------------------------------------------
// 2. OSS only — no TipTap Pro/Cloud packages
// ---------------------------------------------------------------------------
test("OSS only: no TipTap Pro or Cloud packages in dependencies or peerDependencies", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

  // Explicit patterns that would indicate commercial / non-OSS TipTap packages
  const PRO_PATTERNS = [
    /@tiptap-pro\//,          // @tiptap-pro/extension-*
    /@tiptap-cloud\//,        // @tiptap-cloud/*
    /tiptap-pro/,             // standalone tiptap-pro package
    /-pro$/,                  // any @tiptap/extension-*-pro suffix pattern
  ];

  const allDeps = {
    ...pkg.dependencies,
    ...pkg.peerDependencies,
  };

  for (const depName of Object.keys(allDeps)) {
    for (const pattern of PRO_PATTERNS) {
      expect(depName).not.toMatch(pattern);
    }
  }
});

// ---------------------------------------------------------------------------
// 3. Zero domain coupling — production src imports only from allowed origins
// ---------------------------------------------------------------------------
test("zero domain coupling: src files import only relative, react, @tiptap/*, or prosemirror-*", () => {
  // Allowed non-relative module origins for production source files
  const ALLOWED_PREFIXES = [
    "react",          // "react" and "react/jsx-runtime" etc.
    "react-dom",      // "react-dom" and "react-dom/client" etc.
    "@tiptap/",       // any @tiptap/* package
    "prosemirror-",   // any prosemirror-* package
  ];

  /**
   * Recursively collect all .ts/.tsx source files under a directory,
   * excluding *.test.ts, *.test.tsx, and the guards file itself.
   */
  function collectSourceFiles(dir: string): string[] {
    const files: string[] = [];
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        files.push(...collectSourceFiles(full));
      } else if (
        (entry.endsWith(".ts") || entry.endsWith(".tsx")) &&
        !entry.endsWith(".test.ts") &&
        !entry.endsWith(".test.tsx") &&
        entry !== "guards.test.ts"
      ) {
        files.push(full);
      }
    }
    return files;
  }

  /** Extract all module specifiers from import/export … from "X" statements. */
  function extractImports(source: string): string[] {
    // Matches: import ... from "X" | export ... from "X" (double or single quotes)
    const re = /(?:import|export)\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
    const specifiers: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      specifiers.push(m[1]);
    }
    return specifiers;
  }

  const srcDir = join(ROOT, "src");
  const sourceFiles = collectSourceFiles(srcDir);

  // Ensure we actually scanned some files (guards against a vacuous pass)
  expect(sourceFiles.length).toBeGreaterThan(0);

  const violations: string[] = [];

  for (const file of sourceFiles) {
    const source = readFileSync(file, "utf-8");
    const imports = extractImports(source);
    const relFile = relative(ROOT, file);

    for (const specifier of imports) {
      // Relative imports are always fine
      if (specifier.startsWith(".")) continue;

      // Check against the allowlist
      const allowed = ALLOWED_PREFIXES.some(
        (prefix) => specifier === prefix || specifier.startsWith(prefix)
      );

      if (!allowed) {
        violations.push(`${relFile}: disallowed import "${specifier}"`);
      }
    }
  }

  expect(violations).toEqual([]);
});

// ---------------------------------------------------------------------------
// 4. Stable public API
// ---------------------------------------------------------------------------
test("stable public API: runtime exports and type re-exports are present in index.ts", () => {
  /**
   * We read src/index.ts as text rather than doing a runtime import to avoid
   * jsdom environment issues from mounting TipTap/ProseMirror in a guard test.
   * The type-level exports (GlassEditorProps, SlashItem, AiAdapter) cannot be
   * checked at runtime anyway; the regular exports are validated here by text
   * assertion and are also confirmed passing through the existing test suite.
   *
   * Note: the full runtime export values (GlassEditor, defaultExtensions, …)
   * are independently validated by their own unit tests (GlassEditor.test.tsx,
   * extensions.test.ts, items.test.ts, etc.).
   */
  const indexSrc = readFileSync(join(ROOT, "src", "index.ts"), "utf-8");

  // Runtime-value exports that consumers will import
  const REQUIRED_VALUE_EXPORTS = [
    "GlassEditor",
    "defaultExtensions",
    "defaultSlashItems",
    "aiSlashItems",
    "VERSION",
    "filterSlashItems",
    "defaultBubbleItems",
  ];

  // Type exports that must survive the public surface
  const REQUIRED_TYPE_EXPORTS = [
    "GlassEditorProps",
    "SlashItem",
    "AiAdapter",
    "BubbleItem",
  ];

  for (const name of REQUIRED_VALUE_EXPORTS) {
    expect(indexSrc, `index.ts must export "${name}"`).toMatch(
      new RegExp(`\\bexport\\b.+\\b${name}\\b`)
    );
  }

  for (const name of REQUIRED_TYPE_EXPORTS) {
    expect(indexSrc, `index.ts must re-export type "${name}"`).toMatch(
      new RegExp(`\\b${name}\\b`)
    );
  }
});
