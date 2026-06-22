# @nakshatra.io/clean-editor

## 0.1.0

Initial public release — a standalone React + TipTap WYSIWYG editor.

- Slash-command menu (`/`): caret-anchored popup, type-to-filter, ↑/↓/Enter keyboard nav, and a cursor-relative `＋` gutter button.
- Injected AI adapter — "Continue Writing" and "Ask AI" open one inline input with a sparkle submit (omit the adapter to hide them).
- Selection bubble menu — Bold, Italic, and Link with an inline URL input (no native prompts).
- CSS-variable theme with automatic light/dark (`prefers-color-scheme`) and an explicit `theme` prop override.
- Controlled API: `value` (ProseMirror JSONContent) + `onChange`; overridable `extensions`, `slashItems`, and `bubbleItems`.
- Zero domain coupling; OSS only (TipTap StarterKit + free MIT extensions; no Pro/Cloud).
