# Popup + Demo Fix Report

## Fix 1 — Slash popup appended to `.glass-editor` root (`src/GlassEditor.tsx`)

**Root cause:** `onStart` appended the popup container to `document.body`. The CSS custom properties (`--glass-popup-bg`, `--glass-popup-fg`, `--glass-popup-border`, `--glass-hover`, `--glass-radius`, `--glass-shadow`) are scoped to `.glass-editor`, so a `body`-level node couldn't resolve them. The popup rendered with no background and leaked the page's text color.

**Change (lines 112–113 in `slashRenderer().onStart`):**

```ts
// Before
container = document.createElement("div");
document.body.appendChild(container);

// After
container = document.createElement("div");
const root = (props.editor.view.dom as HTMLElement).closest(".glass-editor") ?? document.body;
root.appendChild(container);
```

The popup uses `position: fixed`, so nesting it inside `.glass-editor` does not affect its screen position or clipping. `onExit` (`container?.remove()`) was left unchanged.

## Fix 2 — Demo: 85% viewport sizing + dark theming (`demo/src/styles.css`)

| Selector | Change |
|---|---|
| `.demo-layout` | `width: 85vw; max-width: 85vw; margin: 0 auto; padding: 2rem 0;` (removed `max-width: 800px`) |
| `.editor-wrapper` | `min-height: 70vh` (was `200px`) |
| `@media (max-width: 860px)` | Added `.demo-layout { width: 92vw; max-width: 92vw; }` to merged block |
| `@media (prefers-color-scheme: dark)` | Added `.editor-wrapper`, `.json-preview pre`, `.json-preview h2`, `.demo-header h1/p/kbd` dark values to eliminate white-wrapper-on-dark-editor clash |

Light-mode defaults and the two-column grid were left unchanged.

## Build results

| Check | Result |
|---|---|
| `pnpm test` | 35/35 passed across 14 test files |
| `pnpm typecheck` | Clean (no errors) |
| `pnpm demo:build` | `demo/dist` emitted — `index.html`, CSS (6.19 kB), JS (534 kB) |
