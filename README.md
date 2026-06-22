<div align="center">

<img alt="Clean Editor — a React + TipTap rich-text editor with a slash menu and injected AI" src="assets/clean-editor-social.png" width="100%">

<br/>
<br/>

**A small, reusable React + TipTap rich-text editor — pluggable blocks, a `/` slash-command menu, and an injected AI adapter. Domain-agnostic.**

[![CI](https://github.com/Nakshatra-LLC/clean-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/Nakshatra-LLC/clean-editor/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@nakshatra.io/clean-editor.svg)](https://www.npmjs.com/package/@nakshatra.io/clean-editor)
[![License: MIT](https://img.shields.io/badge/License-MIT-6366F1.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18%2B-2DD4BF.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-6366F1.svg)
![Built on TipTap](https://img.shields.io/badge/built%20on-TipTap%20StarterKit-E879F9.svg)
![Status: early](https://img.shields.io/badge/status-early-E879F9.svg)

</div>

---

Clean Editor brings a polished, "Notion-like" TipTap editing experience using **free MIT primitives** — TipTap's StarterKit plus a handful of free extensions — so you own the result and can share one editor across multiple products via a single dependency-injected component.

The editor knows nothing about your backend, your content model, or your AI provider. You inject all of those. That keeps it reusable: the same component powers a CMS, a document builder, or anything else, each supplying its own adapter.

## Why

The polished "Notion"/"Agent" TipTap editors are **Pro/Cloud, not OSS**. Rather than pay per seat or scatter divergent editors across repos, Clean Editor builds that UX once from free primitives and publishes it as a standalone library. The authoring and AI investment becomes reusable, and there's a single editor to maintain.

## Features

- **Slash-command menu** — press `/` for a caret-anchored command popup — type to filter, `↑/↓`/`Enter` to choose; a `＋` gutter button opens it too.
- **Injected AI adapter** — provide an adapter and the slash menu gains **Continue Writing** and **Ask AI**, which insert the result at the cursor. Omit it and those items simply don't appear.
- **Selection bubble menu** — bold / italic / link on text selection.
- **Controlled** — `value` is a ProseMirror JSON doc; `onChange(doc)` fires on every edit. Your app owns persistence, and external `value` updates sync back into the editor.
- **Pluggable** — replace the extension set, append your own slash items (e.g. "Insert image from library"), and theme everything via your own CSS.
- **Zero domain coupling** — no backend imports, no bundled design system, no AI provider baked in. Enforced by [guard tests](AGENTS.md#guarded-patterns-do-not-break).

## Status

**Early.** Published as [`@nakshatra.io/clean-editor`](https://www.npmjs.com/package/@nakshatra.io/clean-editor) — the public API below reflects the current contract and may still evolve before `1.0`. Full design notes live in [`docs/superpowers/specs/2026-06-22-glass-editor-design.md`](docs/superpowers/specs/2026-06-22-glass-editor-design.md).

## Install

`react`, `react-dom`, and the core `@tiptap/*` packages are **peer dependencies** — your app provides a single copy so there's no duplicate React or ProseMirror instance. The block extensions (StarterKit, Link, TaskList, …) ship as regular dependencies of this package.

```bash
# peers (in the host app)
npm install react react-dom @tiptap/react @tiptap/core @tiptap/pm

# the editor
npm install @nakshatra.io/clean-editor
```

During development, link it locally instead:

```jsonc
// host package.json
{
  "dependencies": {
    "@nakshatra.io/clean-editor": "link:../clean-editor"
  }
}
```

## Quick start

```tsx
import { useState } from "react";
import { CleanEditor } from "@nakshatra.io/clean-editor";
import type { JSONContent } from "@tiptap/react";
import "@nakshatra.io/clean-editor/styles.css";

const empty: JSONContent = { type: "doc", content: [] };

export function MyEditor() {
  const [doc, setDoc] = useState<JSONContent>(empty);

  return (
    <CleanEditor
      value={doc}
      onChange={setDoc}
      placeholder="Type / for commands…"
    />
  );
}
```

### With AI

The editor never imports `fetch` or a provider. You supply an `AiAdapter`; where the network call lives is entirely up to your app:

```tsx
import { CleanEditor, type AiAdapter } from "@nakshatra.io/clean-editor";

const ai: AiAdapter = {
  continue: (context) => myBackend.continue(context),
  ask: (context, instruction) => myBackend.ask(context, instruction),
};

<CleanEditor value={doc} onChange={setDoc} ai={ai} />;
```

If the adapter rejects, the slash action inserts nothing and the editor stays usable — it never throws into your app.

## API

```ts
import type { ReactNode } from "react";
import type { Editor, JSONContent, Extension } from "@tiptap/react";

export type AiAdapter = {
  /** Extend prose from the given context. Returns text/markdown to insert. */
  continue: (context: string) => Promise<string>;
  /** Apply a freeform instruction to the context. Returns text/markdown. */
  ask: (context: string, instruction: string) => Promise<string>;
};

export type SlashItem = {
  id: string;
  label: string;
  group?: string;            // e.g. "AI" | "Blocks"
  keywords?: string[];       // used for filtering
  icon?: ReactNode;          // optional icon shown in the popup
  run: (editor: Editor) => void | Promise<void>;
};

export type BubbleItem = {
  id: string;
  label: string;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
};

export function CleanEditor(props: CleanEditorProps): JSX.Element;
export function defaultExtensions(opts?: { placeholder?: string }): Extension[];
export const defaultSlashItems: SlashItem[];
export const defaultBubbleItems: BubbleItem[];
export function aiSlashItems(ai: AiAdapter): SlashItem[];
export function filterSlashItems(items: SlashItem[], query: string): SlashItem[];
export const VERSION: string;
```

### `<CleanEditor>` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `JSONContent` | — | ProseMirror doc; the source of truth. |
| `onChange` | `(doc: JSONContent) => void` | — | Fires on every edit with the new doc. |
| `ai` | `AiAdapter` | — | Optional. Enables the **Continue Writing** / **Ask AI** slash items. |
| `extensions` | `Extension[]` | `defaultExtensions()` | Replace the default extension set. |
| `slashItems` | `SlashItem[]` | `defaultSlashItems` | Appended to the defaults. |
| `bubbleItems` | `BubbleItem[]` | `defaultBubbleItems` | Appended to the default Bold/Italic/Link bubble; the seam for AI selection menus. |
| `placeholder` | `string` | — | Empty-state placeholder text. |
| `className` | `string` | — | Class on the editor root. |
| `editable` | `boolean` | `true` | Toggle read-only mode. |
| `theme` | `"light" \| "dark"` | — | Force a color theme; omit for automatic (`prefers-color-scheme`). |

**Defaults out of the box:** StarterKit + Link + TaskList + Image + Placeholder, a selection bubble menu, and the `/` slash menu with the standard block items. Everything is overridable through props.

## Theming

Clean Editor ships a **CSS-variable theme** that switches automatically between light and dark via `prefers-color-scheme`. All tokens are overridable on `.clean-editor`:

| Token | Default (light) | Role |
| --- | --- | --- |
| `--clean-bg` | `#ffffff` | Editor surface background |
| `--clean-fg` | `#111827` | Editor text colour |
| `--clean-accent` | `#6366f1` | Focus rings, active states |
| `--clean-radius` | `8px` | Corner radius for containers |
| `--clean-popup-bg` | `#ffffff` | Slash popup / bubble background |

Import the base styles once (sets the variables + structural layout):

```ts
import "@nakshatra.io/clean-editor/styles.css";
```

Override any token from your app's CSS:

```css
.clean-editor {
  --clean-accent: #0ea5e9;
  --clean-radius: 4px;
}
```

## Architecture

| Path | Responsibility |
| --- | --- |
| `src/CleanEditor.tsx` | The React component — composes extensions, bubble menu, gutter, and slash wiring with controlled `value`. |
| `src/extensions.ts` | `defaultExtensions(opts?)` — the OSS TipTap extension set (StarterKit + free additions). |
| `src/index.ts` | Public entry point; re-exports the API and `VERSION`. |
| `src/slash/items.tsx` | `SlashItem` type + `defaultSlashItems` + `filterSlashItems` (headings, lists, quote, code, …). |
| `src/slash/SlashCommand.ts` | TipTap `@tiptap/suggestion` wiring — `createSlashCommand(items)`. |
| `src/slash/icons.tsx` | Icon components (`ReactNode`) used by default slash items. |
| `src/slash/SlashMenu.tsx` | Controlled, grouped slash-menu UI; runs the clicked item and closes. |
| `src/bubble/items.ts` | `BubbleItem` type + `defaultBubbleItems` (Bold, Italic, Link). |
| `src/bubble/BubbleMenu.tsx` | Selection bubble toolbar; merges `defaultBubbleItems` + consumer `bubbleItems`. |
| `src/bubble/LinkInput.tsx` | Inline link-URL input shown inside the bubble. |
| `src/ai/aiSlashItems.tsx` | `AiAdapter` type + `aiSlashItems(ai, hooks?)` — "Continue Writing" / "Ask AI". |
| `src/ai/AskAiInput.tsx` | Inline Ask-AI input shown in the slash menu. |
| `src/gutter/Gutter.tsx` | `＋` gutter button — tracks cursor block and opens the slash popup. |
| `src/positioning.ts` | `clampPopup(rect, viewport)` — keeps slash popup inside the viewport. |
| `src/styles.css` | CSS-variable theme (light/dark auto-switch) + structural layout hooks. |
| `src/guards.test.ts` | Architecture guard tests — enforce peer singletons, OSS-only, zero coupling, stable API. |

Built with **Vite** in library mode (ESM + `.d.ts` via `vite-plugin-dts`, peers externalized). Tested with **vitest + @testing-library/react + jsdom**.

## Roadmap

Designed to add later without breaking consumers — community / v2:

- **Rich AI action menus** — Adjust Tone, Summarize, Translate, Fix grammar — all as `bubbleItems` / `slashItems` that call `ai.ask` with preset instructions.
- **Drag-to-reorder blocks** — a custom OSS drag handle in the gutter (TipTap's is Pro).

See [CONTRIBUTING.md](CONTRIBUTING.md#backlog--where-to-help) for the detailed backlog and how to claim an item.

## Out of scope (v1)

Collaboration / TipTap Cloud, the Pro drag handle, image *upload* (inject an image slash item instead), markdown import/export, non-React bindings, mobile-specific UX, and a bundled theme.

## Development

This is a library, so there's no app `dev` server — use the bundled demo or tests.

```bash
pnpm install     # also installs git hooks
pnpm demo        # runnable demo app (Vite) — exercise the editor in a browser
pnpm test        # vitest
pnpm typecheck   # tsc --noEmit
pnpm build       # Vite library build → ESM + types + styles.css
```

Git hooks enforce `typecheck` + `test` on commit and `test` + `build` on push. See [AGENTS.md](AGENTS.md) for the full contributor guide and the guarded patterns.

## Contributing

Issues and PRs welcome — please read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) first. Because the editor is intentionally domain-agnostic, host-specific behavior belongs in your app's adapter and slash items rather than in the core.

## License

[MIT](LICENSE) © Nakshatra LLC
