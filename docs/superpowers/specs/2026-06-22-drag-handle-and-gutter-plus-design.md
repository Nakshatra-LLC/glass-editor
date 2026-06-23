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

## Verified findings (spike, 2026-06-22)

Before planning, the real package API and runtime behavior were verified against installed code. Two findings materially shape the design:

1. **`insertContent("/")` does NOT open the slash menu.** The `@tiptap/suggestion` plugin activates its `render().onStart` only on **genuine DOM input events** (typing). Spikes confirmed: programmatic `insertContent("/")`, `tr.insertText("/")`, and `setTextSelection` nudges all leave the `/` in the doc but never fire `onStart`; only `userEvent.type(dom, "/")` (real input) fires it. **This is the true root cause of the broken `+`.** Therefore the `+` must *not* attempt to trigger the suggestion plugin — it renders the `SlashMenu` component **directly** as a controlled popup (reusing the existing menu UI, items, `reduceSlashKey`, and `item.run`).
2. **The drag handle is a React component, not an extension.** `@tiptap/extension-drag-handle-react@2.27.2` (MIT, no own deps) exports `<DragHandle>` which **self-registers** the ProseMirror plugin on mount. It is mounted in `CleanEditor.tsx`, **not** added to `defaultExtensions()`. Verified props: `editor` (required), `children` (required), `onNodeChange?: ({ node, editor, pos }) => void`, `tippyOptions?` (**must be memoized** or the handle re-initializes every render), `pluginKey?`, `className?`. Its tippy/hover positioning is **not** reproducible in jsdom, so component-level click tests of the handle are infeasible; tests target the behavior functions directly and the handle glue is verified in `pnpm demo`.

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

**What we build:** the handle's *contents* (the `+` button and the SVG grip icon), the `+` behavior (`addBlock` helper + direct `SlashMenu` popup), mounting `<DragHandle>` in `CleanEditor`, and theming.

Rejected alternative — hand-rolling drag on ProseMirror primitives (`NodeSelection` + `view.dragging`): ~150–250 LOC to write, test, and maintain, with more bug surface, for behavior the MIT extension already packages. Not worth it now that the extension is free.

---

## Interaction model: unified hover handle

One handle (`div.drag-handle`, owned by the extension) containing both controls, positioned next to the block under the **mouse pointer** (the extension's native model — hover, not cursor):

```
hover any block ->
   [ +  ⠿ ]  Block text here…
```

- This replaces the current **cursor-tracking** gutter. The custom positioning effect in `CleanEditor.tsx` (the `selectionUpdate`/`transaction` listener that computes `gutterTop` via `coordsAtPos`) and the `gutterTop` state are **removed** — the extension owns positioning. One positioning system, not two.
- **`+` behavior:** inserts a new empty paragraph immediately **after the hovered block**, moves the cursor into it, and opens a slash menu there — so the user "adds a new block/section." If the hovered block is already an empty paragraph, the menu opens in place rather than inserting a redundant empty block. Per [finding 1](#verified-findings-spike-2026-06-22), the menu is the **same `SlashMenu` component** rendered **directly** as a controlled popup (not the suggestion plugin): same grouped UI, same default + injected items, same `reduceSlashKey` keyboard handling; selecting an item runs `item.run(editor)` against the new empty block. The `/`-typed path (suggestion plugin) is unchanged and continues to work for keyboard users.
- **Grip behavior:** press-and-hold to drag; ProseMirror renders the drop indicator and performs the move. No click handler is wired in M1.
- **Icon:** the standard six-dot grip is kept (a universally-recognized "draggable" affordance — not reinvented), but rendered as **inline SVG** (six circles) to match the existing hand-drawn icons in `src/slash/icons.tsx` and to sit cleanly beside the `+` with consistent weight/theming, rather than relying on a Unicode braille glyph.

### Controlled-component contract

Reordering and `+`-insertion both flow through the normal editor transaction → `onUpdate` → `onChange(editor.getJSON())`. The host's `value`/`onChange` stays the single source of truth; no special-casing. (Guard: external `value` sync logic is untouched.)

---

## Affected modules

| File | Change |
| --- | --- |
| `package.json` | Add `@tiptap/extension-drag-handle-react` (`^2.27`) to `dependencies`. (No change to `extensions.ts` — the handle is a React component, not an extension; see [finding 2](#verified-findings-spike-2026-06-22).) |
| `src/gutter/addBlock.ts` (new) | `openAddBlockMenu`-style pure helper: given `editor` + hovered `pos`, insert an empty paragraph after that block (or reuse it if already an empty paragraph) and move the selection into it. Returns the position so the popup can anchor. No DOM/React — directly unit-testable with a real `Editor`. |
| `src/gutter/Gutter.tsx` | Re-cast as the handle contents inside `<DragHandle>`: render the `+` button and the SVG grip. `+` click calls the `addBlock` helper then opens the direct `SlashMenu` popup. Drop the old cursor-anchored markup and `openSlashAt`/`insertContent("/")`. |
| `src/gutter/icons.tsx` (new) | The six-dot grip as an inline SVG component, styled with `currentColor`. |
| `src/CleanEditor.tsx` | Remove the `gutterTop` state and the `selectionUpdate`/`transaction` positioning effect (lines ~33, ~66–86). Mount `<DragHandle editor={editor} tippyOptions={memoized} onNodeChange={…}>` containing the gutter contents; track the hovered `pos` via `onNodeChange` for the `+`. Manage the direct `SlashMenu` popup open/close + anchor state here (same layer that already hosts the AI input and bubble menu). |
| `src/styles.css` | Restyle `.clean-gutter`/grip for the unified handle; theme the drop-indicator line via CSS vars (light/dark). Keep the `.clean-*` prefix. |
| Tests (co-located) | See below. |

---

## Testing strategy (TDD — RED first)

The current bug exists *because* tests mocked the editor (`Gutter.test.tsx`'s `fakeEditor` only checked that `"/"` was pushed into a fake chain — it never ran the real suggestion plugin, which is exactly the path that's broken). M1 fixes that by testing against a **real `Editor`** at the behavior layer.

1. **`addBlock` helper — real editor.** Construct a real `Editor` (pattern from `SlashCommand.test.ts`: `new Editor({ element, extensions: [StarterKit], content })`). Call the helper with the hovered block's `pos`. Assert: on a non-empty block, a new empty paragraph exists immediately after it and the selection is collapsed inside it; on an already-empty paragraph, no redundant block is inserted and the selection lands in it. (`getJSON()` + `state.selection` assertions.)
2. **Direct `SlashMenu` popup renders and runs items.** Reuse/extend the existing `SlashMenu.test.tsx` approach: render the popup with the merged item list, assert grouped items appear (`[role="menu"]`/`.clean-slash`), simulate a click and arrow+enter (`reduceSlashKey`), and assert the chosen `item.run` fired. This replaces the impossible "trigger the suggestion from a button" test.
3. **Drag reorder.** Native HTML5 DnD is not faithfully simulable in jsdom, and the tippy handle does not render there ([finding 2](#verified-findings-spike-2026-06-22)). Test the smallest real unit we own — assert the handle dependency is wired and, if a reorder command/helper is extracted, unit-test it against a real `Editor` (block order in `getJSON()` changes, `onChange` fires). The end-to-end drag feel is verified manually in `pnpm demo`; this boundary is stated explicitly, not hidden.
4. **Guard tests still green** (`src/guards.test.ts`): peer singletons not duplicated; no Pro/Cloud packages; public API surface unchanged. Optionally assert the drag-handle dep is `@tiptap/*` (MIT), not `@tiptap-pro/*`.
5. **Pristine output:** no new warnings/logs (the known TipTap `act(...)` teardown artifact aside).

> **jsdom boundary (explicit):** the `+` *click through the rendered tippy handle* and the *native drag* are not jsdom-testable. We do not fake them with mocked editors (that is what hid the original bug). Instead we test the real behavior beneath them (`addBlock`, the `SlashMenu` popup, any reorder helper) and verify the glue in the demo.

---

## Risks & mitigations

- **jsdom can't fully simulate native HTML5 drag-and-drop, and the tippy handle does not render there.** Mitigation: assert behavior at the helper/command layer against a real `Editor`; verify the end-to-end feel manually in `pnpm demo`. Stated as an explicit boundary, not hidden behind mocked-editor tests.
- **`tippy.js` transitive dep / styling.** The core handle pulls `tippy.js@^6` (MIT, confirmed). Ensure its default styles don't clash with the clean theme; the `tippyOptions` object passed to `<DragHandle>` **must be memoized** (else the handle re-initializes every render).
- **Extension API verified** against installed `2.27.2` (props in [finding 2](#verified-findings-spike-2026-06-22)); no open API questions.
- **Demo + screenshots** (`demo/`, `assets/*.png`) will need refreshing to show the working handle.

---

## Future milestones (deferred, for context only)

- **M2 — block-actions menu (core):** grip **click** opens a menu with Turn Into (reuse slash style items), Reset formatting, Duplicate node, Copy to clipboard, Delete. No new deps.
- **M3 — block-actions menu (advanced):** Color ▸ (adds MIT `@tiptap/extension-text-style` + `-color` + `-highlight` and a submenu), Copy anchor link (needs stable block IDs), Ask AI (wires to the injected `AiAdapter`).

Each future milestone gets its own spec → plan → PR.
