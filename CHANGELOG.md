# @nakshatra.io/clean-editor

## 0.1.2

### Patch Changes

- 097b161: `VERSION` now derives from `package.json` at build time, so it can never drift from the published version.

## 0.1.1

### Patch Changes

- a47114f: Add an opt-in `liveDoc` prop to `CleanEditor` — renders a built-in, read-only JSON inspector of the current document (default `false`).

  Also: fix the demo's light/dark page chrome (the toggle now themes the whole page) and the header logo (solid app icon, base-path aware so it renders on the Pages subpath and on light backgrounds); the demo dogfoods `liveDoc` via a "Show JSON" toggle; add demo screenshots + a live-demo link to the README.

## 0.1.0

Initial public release — a standalone React + TipTap WYSIWYG editor.

- Slash-command menu (`/`): caret-anchored popup, type-to-filter, ↑/↓/Enter keyboard nav, and a cursor-relative `＋` gutter button.
- Injected AI adapter — "Continue Writing" and "Ask AI" open one inline input with a sparkle submit (omit the adapter to hide them).
- Selection bubble menu — Bold, Italic, and Link with an inline URL input (no native prompts).
- CSS-variable theme with automatic light/dark (`prefers-color-scheme`) and an explicit `theme` prop override.
- Controlled API: `value` (ProseMirror JSONContent) + `onChange`; overridable `extensions`, `slashItems`, and `bubbleItems`.
- Zero domain coupling; OSS only (TipTap StarterKit + free MIT extensions; no Pro/Cloud).
