---
"@nakshatra.io/clean-editor": minor
---

Block gutter (M1): a hover drag-handle and a working `+` button.

- **Drag to reorder** — hovering a block reveals a six-dot grip; press-and-hold to reorder blocks, built on the MIT `@tiptap/extension-drag-handle-react` (no Pro/Cloud packages).
- **Working `+`** — the gutter `+` inserts a new block and opens an add-block menu (the same item set as the `/` slash menu). The previous `+` (which inserted a literal `/`) never opened a menu; that behavior is removed.
- **`extensions` prop now accepts a function** — `extensions?: Extension[] | ((defaults: Extension[]) => Extension[])`. The function form receives the fully-wired defaults (including the slash command) so you can extend, reorder, or remove them without disabling `/`. The array form still fully replaces the defaults (non-breaking).
- The old cursor-tracking gutter and the non-functional `openSlashAt` are removed; the drag-handle extension owns positioning.

Fixes found during verification: the `/` and `+` menus no longer get torn down on every keystroke (memoized `onNodeChange`), `+` no longer crashes the tree (the add-block menu is portaled into the editor root), keyboard navigation now scrolls the active item into view, the add-block menu dismisses on outside click and closes when `value` is replaced externally.
