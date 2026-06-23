# Design: Block drag handle + working `+` (M1)

**Date:** 2026-06-22
**Status:** Proposed
**Scope:** A single milestone (M1) of a larger Notion-style block-gutter effort. M2/M3 (block-actions menu) are explicitly deferred — see [Future milestones](#future-milestones).

---

## Problem

The editor renders a left gutter with a `＋` button and an inert drag-handle slot (`src/gutter/Gutter.tsx`):

- The **`+` does not work.** It runs `editor.chain().focus().insertContent("/")`, which drops a literal `/` character but does **not** open the slash menu. The existing tests mock the entire editor (`fakeEditor`), so they assert only that `"/"` was inserted — they never exercise the real `@tiptap/suggestion` plugin, which is why the broken behavior shipped.
- The **drag handle is inert by design** — the slot was reserved with a comment noting drag was deferred pending "a custom OSS impl."

Net result: the gutter adds visual chrome but no working affordance, in an editor whose whole brand is "clean."

## Goal

Make the gutter functional:

- **`+`** → adds a new block (opens the slash menu, same flow as typing `/`).
- **Grip (`⠿`)** → press-and-hold to **drag-reorder** blocks.

Both live in one unified handle, hover-positioned next to the block under the pointer.

### Grounding principle

**Do not hand-roll what we get for free.** When a maintained, correctly-licensed (OSS/MIT) package already provides a behavior, use it rather than reimplementing it. This applies first and foremost to drag-and-drop here (the MIT `@tiptap/extension-drag-handle-react` over a custom ProseMirror impl), and to every future milestone: reach for the off-the-shelf extension/command before writing bespoke logic. We only build what the library genuinely does not give us (here: the handle's `+` button, the grip icon markup, and theming).

### Non-goals (this milestone)

- The block-actions menu shown on grip **click** (Turn Into, Color, Duplicate, Copy, Ask AI, Delete) — deferred to M2/M3.
- Multi-block selection drag.
- Keyboard-driven reorder (the grip is mouse-only; this is an accepted trade-off — `/` still serves keyboard users for block insertion).

---

## Key decision: official MIT extension, not hand-rolled

Drag-and-drop reorder is provided by the **official `@tiptap/extension-drag-handle-react`**.

- It was Pro-only in older Tiptap, but **`@tiptap/extension-drag-handle-react@2.27.2` is MIT** and compatible with this project's Tiptap v2 line (`@tiptap/core ^2.8.0`). Verified: license MIT; peer-deps are `react`, `react-dom`, `@tiptap/pm`, `@tiptap/react` — all already our peer singletons; it pulls `@tiptap/extension-drag-handle` (→ `tippy.js`, MIT) as a transitive.
- This satisfies the guarded patterns: it is `@tiptap/*`, not `@tiptap-pro/*` / `@tiptap-cloud/*` (guard 2 — OSS only), and it does not duplicate any peer singleton (guard 1).
- It belongs in `dependencies`, exactly like the other `@tiptap/extension-*` packages we already depend on.

**What the extension provides (no hand-rolling):** the hover-positioned handle element, making it draggable, building the `NodeSelection`, handing off to ProseMirror's native drag-and-drop, the actual move on drop, the drop-indicator line (PM core), and click-vs-drag discrimination.

**What we build:** the handle's *contents* (the `+` button and the SVG grip icon), the `+` behavior, registration/config in `defaultExtensions`, and theming.

Rejected alternative — hand-rolling drag on ProseMirror primitives (`NodeSelection` + `view.dragging`): ~150–250 LOC to write, test, and maintain, with more bug surface, for behavior the MIT extension already packages. Not worth it now that the extension is free.

---

## Interaction model: unified hover handle

One handle (`div.drag-handle`, owned by the extension) containing both controls, positioned next to the block under the **mouse pointer** (the extension's native model — hover, not cursor):

```
hover any block ->
   [ +  ⠿ ]  Block text here…
```

- This replaces the current **cursor-tracking** gutter. The custom positioning effect in `CleanEditor.tsx` (the `selectionUpdate`/`transaction` listener that computes `gutterTop` via `coordsAtPos`) and the `gutterTop` state are **removed** — the extension owns positioning. One positioning system, not two.
- **`+` behavior:** inserts a new empty paragraph immediately **after the hovered block**, moves the cursor into it, and opens the slash menu there — so the user "adds a new block/section." The menu UI and keyboard flow are identical to typing `/` (we reuse `SlashMenu` and the existing suggestion renderer unchanged). If the hovered block is already an empty paragraph, open the menu in place rather than inserting a redundant empty block.
- **Grip behavior:** press-and-hold to drag; ProseMirror renders the drop indicator and performs the move. No click handler is wired in M1.
- **Icon:** the standard six-dot grip is kept (a universally-recognized "draggable" affordance — not reinvented), but rendered as **inline SVG** (six circles) to match the existing hand-drawn icons in `src/slash/icons.tsx` and to sit cleanly beside the `+` with consistent weight/theming, rather than relying on a Unicode braille glyph.

### Controlled-component contract

Reordering and `+`-insertion both flow through the normal editor transaction → `onUpdate` → `onChange(editor.getJSON())`. The host's `value`/`onChange` stays the single source of truth; no special-casing. (Guard: external `value` sync logic is untouched.)

---

## Affected modules

| File | Change |
| --- | --- |
| `package.json` | Add `@tiptap/extension-drag-handle-react` (`^2.27`) to `dependencies`. |
| `src/extensions.ts` | Register the drag-handle extension in `defaultExtensions`. Keep it overridable/removable per the injection rules (consumers passing their own `extensions` opt out). |
| `src/gutter/Gutter.tsx` | Re-cast as the handle contents: render `+` and the SVG grip inside the extension's `<DragHandle>`. Implement the corrected `+` (insert-after-hovered-block + open slash menu). Drop the old cursor-anchored markup. |
| `src/gutter/icons.tsx` (new) | The six-dot grip as an inline SVG component, styled with `currentColor`. |
| `src/CleanEditor.tsx` | Remove the `gutterTop` state and the `selectionUpdate`/`transaction` positioning effect (lines ~33, ~66–86). Mount the `<DragHandle>`-based gutter instead of the cursor-positioned `<Gutter top=…>`. |
| `src/styles.css` | Restyle `.clean-gutter`/grip for the unified handle; theme the drop-indicator line via CSS vars (light/dark). Keep the `.clean-*` prefix. |
| Tests (co-located) | See below. |

---

## Testing strategy (TDD — RED first)

The current bug exists *because* tests mocked the editor. M1 fixes that.

1. **`+` opens the slash menu — real integration test.** Mount a real `CleanEditor` (real Tiptap, jsdom), trigger the `+`, and assert the slash menu actually renders (e.g. a `[role="menu"]` / known slash item appears) — not merely that `"/"` was inserted into a fake chain. This is the regression test for the shipped bug.
2. **`+` adds a block in the right place.** After `+` on a non-empty block, assert a new empty paragraph exists after it and the selection is inside it; on an empty paragraph, assert no redundant block was inserted.
3. **Drag reorder → document order changes.** Where jsdom permits, simulate the extension's drag/drop (or unit-test the reorder command path) and assert the resulting `getJSON()` block order changed and `onChange` fired. If full DnD isn't faithfully simulable in jsdom, test the smallest real unit (the move command / `NodeSelection` handoff) and document the boundary.
4. **Guard tests still green** (`src/guards.test.ts`): peer singletons not duplicated; no Pro/Cloud packages; public API surface unchanged. Add an assertion if useful that the drag-handle dep is an `@tiptap/*` (MIT) package, not `@tiptap-pro/*`.
5. **Pristine output:** no new warnings/logs (the known TipTap `act(...)` teardown artifact aside).

---

## Risks & mitigations

- **jsdom can't fully simulate native HTML5 drag-and-drop.** Mitigation: assert the reorder at the command/transaction layer and keep the DnD-glue thin; verify the end-to-end feel manually in `pnpm demo`.
- **`tippy.js` transitive dep / styling.** The extension positions via tippy; ensure its default styles don't clash with the clean theme, and that nothing leaks a non-OSS or heavy dep. Confirm the dep tree at implementation.
- **Exact extension API for v2.27** (`<DragHandle>` props: `editor`, `onNodeChange`, `tippyOptions`, `pluginKey`) is finalized against the installed package's types during implementation, not pinned here.
- **Demo + screenshots** (`demo/`, `assets/*.png`) will need refreshing to show the working handle.

---

## Future milestones (deferred, for context only)

- **M2 — block-actions menu (core):** grip **click** opens a menu with Turn Into (reuse slash style items), Reset formatting, Duplicate node, Copy to clipboard, Delete. No new deps.
- **M3 — block-actions menu (advanced):** Color ▸ (adds MIT `@tiptap/extension-text-style` + `-color` + `-highlight` and a submenu), Copy anchor link (needs stable block IDs), Ask AI (wires to the injected `AiAdapter`).

Each future milestone gets its own spec → plan → PR.
