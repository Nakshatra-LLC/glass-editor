# @nakshatra.io/clean-editor

How to work on the Clean Editor library. Written for humans and AI coding assistants.

> This file (`AGENTS.md`) is the **canonical** contributor and agent guide. `CLAUDE.md` and other tool-specific files are thin pointers to it. Edit this file, not the pointers.

**IMPORTANT for AI agents**: Read [Architecture](#architecture), the [conventions](#contributor-rules), and [Guarded patterns](#guarded-patterns-do-not-break) before contributing. They cover the module layout, the peer-dependency contract, the patterns enforced by tests, and the project's hard constraints. Come back to them when unsure.

---

## What is Clean Editor

- A standalone, publishable WYSIWYG editor library: a `<CleanEditor>` React component built on OSS TipTap (StarterKit + free MIT extensions).
- Ships a `/` slash menu, default blocks, a bubble toolbar, and an **injected** AI adapter (Continue Writing / Ask AI).
- **OSS only.** TipTap StarterKit and free MIT extensions. No Pro/Cloud packages, ever.
- **Zero domain coupling.** No host backend or domain imports. AI, slash items, and extensions are injected by the consumer. The library knows nothing about any specific app.
- **Controlled component.** State flows through `value` (ProseMirror JSON) + `onChange`. The host owns the document; external `value` changes propagate into the editor.
- Favor small, focused modules with one clear responsibility and a well-defined interface.

---

## Contributor rules

- Work in small, iterative steps. If a task is too broad, say so and propose smaller steps.
- **TDD is mandatory.** Write a failing test first (RED), implement to green (GREEN), then refactor. No implementation without a test.
- Make single-purpose, small diffs. No sweeping changes in one commit.
- **AI attribution is required.** Any commit produced with AI assistance **must** carry an attribution trailer naming the tool used — a generic `Assisted-By:` line plus a `Co-Authored-By:` line. The trailer is tool-agnostic; name whichever assistant was used. Example:

  ```
  Assisted-By: Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

  (If you used a different assistant, name it instead — e.g. `Assisted-By: Cursor`, `Co-Authored-By: <agent> <email>`.)
- **No private or app-specific names** in code, comments, or docs. Use neutral placeholders (e.g. `myBackend`) in examples.
- Never break the peer-dependency contract or the other [guarded patterns](#guarded-patterns-do-not-break) — they are enforced by tests in `src/guards.test.ts`.
- Run the [validation checklist](#validation-enforced-by-git-hooks) before committing. Git hooks enforce it automatically.
- Keep tests' output pristine — warnings and stray logs are findings.

---

## Key scripts

Run from the repo root with `pnpm <script>`:

| Script        | What it does                                              |
| ------------- | -------------------------------------------------------- |
| `build`       | Vite library build (ESM) + rolled-up `.d.ts` types       |
| `test`        | Run the Vitest suite once (`vitest run`)                  |
| `typecheck`   | Type-check with `tsc --noEmit` (no emit)                 |
| `demo`        | Start the local demo app (Vite dev server)               |
| `demo:build`  | Build the demo app to static files                        |

There is no library `dev` script — this is a library, not an app. Use `pnpm demo` to exercise it interactively, or write a Vitest test.

---

## Validation (enforced by git hooks)

```bash
pnpm typecheck  # tsc --noEmit — zero errors
pnpm test       # full Vitest suite — must be green, output pristine
```

Git hooks (Husky) enforce this so broken code cannot land:

- **pre-commit** runs `pnpm typecheck` then `pnpm test`. A failure **hard-fails the commit**.
- **pre-push** runs `pnpm test` then `pnpm build`. A failure **hard-fails the push**.

Hooks install automatically via the `prepare` script on `pnpm install`. Do not bypass them with `--no-verify` except for genuine emergencies, and never to skip a failing test.

Before tagging a release, also confirm the build is consumable:

```bash
pnpm build      # produces dist/index.js, dist/index.d.ts, dist/styles.css
```

`dist/` is git-ignored and never committed — `package.json#files` controls what ships to npm.

---

## Architecture

Source lives under `src/`. Each file has one responsibility:

| File                       | Responsibility                                                              |
| -------------------------- | -------------------------------------------------------------------------- |
| `index.ts`                 | Public entry point. Re-exports the whole API; `VERSION`.                    |
| `extensions.ts`            | `defaultExtensions(opts?)` — the OSS TipTap extension set.                  |
| `slash/items.tsx`          | `SlashItem` type + `defaultSlashItems` + `filterSlashItems` (headings, lists, quote, code, …). |
| `slash/SlashCommand.ts`    | TipTap `@tiptap/suggestion` wiring — `createSlashCommand(items)`.           |
| `slash/icons.tsx`          | Icon components (`ReactNode`) used by default slash items.                  |
| `slash/SlashMenu.tsx`      | Controlled, grouped slash-menu UI; runs the clicked item and closes.        |
| `bubble/items.ts`          | `BubbleItem` type + `defaultBubbleItems` (Bold, Italic, Link).              |
| `bubble/BubbleMenu.tsx`    | Selection bubble toolbar; merges `defaultBubbleItems` + consumer `bubbleItems`. Exports `CleanBubbleMenu`. |
| `bubble/LinkInput.tsx`     | Inline link-URL input shown inside the bubble.                              |
| `gutter/Gutter.tsx`        | `＋` gutter button — tracks cursor block and opens the slash popup.         |
| `positioning.ts`           | `clampPopup(rect, viewport)` — keeps slash popup inside the viewport.       |
| `ai/aiSlashItems.tsx`      | `AiAdapter` type + `aiSlashItems(ai, hooks?)` — "Continue Writing" / "Ask AI". |
| `CleanEditor.tsx`          | The main component. Composes extensions, bubble menu, gutter, and slash.    |
| `styles.css`               | CSS-variable theme (light/dark auto-switch) + structural layout hooks. Uses `.clean-*` class prefix. |
| `guards.test.ts`           | Architecture guard tests — enforce the [guarded patterns](#guarded-patterns-do-not-break). |

Design rules:

- **Injection over coupling.** The AI adapter, extra slash items, extra bubble items, and extensions are all props. Defaults are provided but always overridable.
- **Slash-item merge order** in `CleanEditor` is `[...(ai ? aiSlashItems(ai) : []), ...defaultSlashItems, ...(slashItems ?? [])]`.
- **Bubble-item merge order** in `CleanEditor` is `[...defaultBubbleItems, ...(bubbleItems ?? [])]`.
- **Controlled value.** `CleanEditor` syncs external `value` changes into the editor (guarded against echo loops) and always calls the latest `onChange` via a ref.
- Co-locate each module's `*.test.ts(x)` beside it.

---

## Guarded patterns (do not break)

These invariants are the library's contract with consumers. `src/guards.test.ts` enforces them — if you change one, you must change the test and explain why in the PR. They exist so a well-meaning edit can't silently break a consumer's install.

1. **Peer-dependency singletons.** `react`, `react-dom`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/react` are declared in `peerDependencies` and **must not** also appear in `dependencies`. Duplicating ProseMirror/TipTap/React breaks editing.
2. **OSS only.** No TipTap Pro/Cloud packages (`@tiptap-pro/*`, `@tiptap-cloud/*`) anywhere in `dependencies`.
3. **Zero domain coupling.** Nothing under `src/` imports a host/app/backend package. Only React, `@tiptap/*`, ProseMirror, and relative `./` imports are allowed.
4. **Stable public API.** `src/index.ts` exports the documented surface (`CleanEditor`, `CleanEditorProps`, `defaultExtensions`, `SlashItem`, `defaultSlashItems`, `AiAdapter`, `aiSlashItems`, `VERSION`). Removing or renaming an export is a breaking change.

---

## Environment

- **Node** 18+ (the repo is developed on Node 24).
- **pnpm** with the repo lockfile. Use `pnpm`, never `npm` or `yarn`.
- **Peer dependencies are singletons** (see [Guarded patterns](#guarded-patterns-do-not-break)). Individual TipTap extensions (StarterKit, Link, TaskList, etc.) are regular `dependencies`.
- The Vite build marks `react`, `react-dom`, `react/jsx-runtime`, `@tiptap/*`, and `prosemirror-*` as external — they are never bundled.

---

## Continuous integration

- **CI** (`.github/workflows/ci.yml`) runs on every push and pull request: install, `typecheck`, `test`, `build`. PRs cannot merge red.
- **Pages** (`.github/workflows/pages.yml`) builds the demo app and deploys it to GitHub Pages on push to `main`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full contribution workflow.

---

## Troubleshooting

- **Editing behaves strangely / "duplicate ProseMirror" errors:** a peer dep got bundled or duplicated. Verify the singletons above stay external and as `peerDependencies` (guard test 1).
- **`act(...)` warnings in test output:** mounting a real TipTap editor in jsdom emits these from TipTap's async teardown; they are a known environment artifact, not a component bug. Do not silence them by disabling React's act environment.
- **Type errors only at build time:** run `pnpm typecheck` for the fast signal; the build's declaration step uses `tsconfig.build.json` (which excludes tests).
- **A commit/push was rejected by a hook:** the suite or typecheck failed. Read the output and fix the code — do not `--no-verify`.
