# Glass Editor — Editing UX & Theming (0.1.0) Design

> Builds on `2026-06-22-glass-editor-design.md`. This spec covers the editing-UX
> upgrade: a real slash-command popup, a cursor-relative `＋` gutter, a
> CSS-variable theme (light/dark), inline Link & Ask-AI UIs (replacing native
> `window.prompt`), and a bubble/selection extensibility hook.

## Background & motivation

The shipped v1 slash menu is a placeholder: pressing `/` opens a fixed,
top-left toggle menu but leaves the literal `/` in the document, isn't anchored
to the caret, has no filtering, and has no keyboard navigation. The bubble
toolbar and editor content are only minimally styled, and Link / Ask-AI use the
native `window.prompt` dialog. This spec replaces that with a polished,
Notion-like editing experience while keeping the library OSS-only,
domain-agnostic, and extensible.

**Guiding principle:** ship great **defaults** plus clean **extension hooks**,
then stop. Rich AI action menus (tone, summarize, translate, …), selection
context menus, and drag-to-reorder are explicitly **v2 / community** territory
and must be buildable on top of the hooks below with **no core changes**.

## Goals

- Typing `/` opens a caret-anchored command popup; the `/` and typed query are
  consumed (not left in the doc) and used as a live filter.
- Keyboard-first: `↑/↓` move the highlighted item, `Enter`/`Tab` select,
  `Esc` dismisses. Selecting an item removes the `/`+query range and runs it.
- A cursor-relative `＋` button in the left gutter that tracks the current block
  and opens the slash menu; fully stylable.
- A polished default theme driven by CSS custom properties, with light and dark
  values that auto-switch (`prefers-color-scheme`) and are host-overridable.
- Inline Link editing and inline Ask-AI input — no native `window.prompt`.
- A bubble/selection extensibility hook so AI selection menus can be added
  without touching core.

## Non-goals (deferred to v2 / community)

- Rich AI action menus over a selection (Adjust Tone, Fix grammar, Make
  longer/shorter, Simplify, Emojify, Add summary, Languages, …). These are
  preset instructions over `ai.ask` and are buildable via `bubbleItems` /
  `slashItems`.
- Drag-to-reorder blocks. (TipTap's drag handle is **Pro**; this project is
  OSS-only, so drag needs a custom OSS implementation later. A visual slot in
  the gutter may be reserved but no behavior ships.)
- A floating-ui/tippy positioning dependency (see Positioning).
- Markdown import/export, image upload, collaboration.

## Constraints (inherited)

- **OSS only** — `@tiptap/suggestion` (MIT) is allowed and re-added; no
  `@tiptap-pro/*` / `@tiptap-cloud/*` (enforced by `src/guards.test.ts`).
- **Zero domain coupling** — no host/backend imports in `src/`.
- **Peer singletons** unchanged (`react`, `react-dom`, `@tiptap/core`,
  `@tiptap/pm`, `@tiptap/react`).
- **Controlled** `value` / `onChange` contract preserved.
- TDD mandatory; tests pristine; AI-attribution trailer required on commits.

## Positioning approach

Popups (slash menu, inline Ask-AI, inline Link, gutter button) are positioned
**manually** from the editor view — no new positioning dependency:

- Caret-anchored popups use `editor.view.coordsAtPos(pos)` to get the caret
  rect, render into a portal (or an absolutely-positioned layer within
  `.glass-editor`), and clamp to the viewport (flip above the caret when there
  isn't room below).
- The gutter `＋` uses the current block's DOM node rect (via
  `editor.view.nodeDOM` / `domAtPos`) to align vertically with the active line.

Rationale: keeps the dependency surface minimal (library philosophy) and avoids
the unmaintained `tippy.js`. If positioning needs outgrow this, `@floating-ui/dom`
is the documented upgrade path — a later, isolated change.

## Architecture & components

```
src/
  GlassEditor.tsx          // composition: editor + gutter + bubble + slash + inline UIs
  extensions.ts            // defaultExtensions() — adds SlashCommand
  slash/
    SlashCommand.ts        // TipTap extension wrapping @tiptap/suggestion ("/")
    SlashMenu.tsx          // React renderer for the suggestion popup (grouped, filtered, keyboard)
    items.ts               // SlashItem type, defaultSlashItems, filterSlashItems()
    icons.tsx              // default inline-SVG icons for items (no icon dep)
  bubble/
    BubbleMenu.tsx         // selection bubble: default items + injected bubbleItems
    items.ts               // BubbleItem type, defaultBubbleItems (Bold/Italic/Link)
    LinkInput.tsx          // inline link editor (replaces window.prompt)
  ai/
    aiSlashItems.ts        // unchanged AiAdapter; Continue/Ask items (icons added)
    AskAiInput.tsx         // inline caret-anchored Ask-AI prompt (replaces window.prompt)
  gutter/
    Gutter.tsx             // cursor-relative ＋ button (opens slash); reserved drag slot
  positioning.ts           // coordsAtPos / block-rect helpers + viewport clamping
  styles.css               // CSS-variable theme (light + dark), polished defaults
  guards.test.ts           // unchanged invariants
```

### Slash command

- **`SlashCommand.ts`** — a TipTap `Extension` configured with `@tiptap/suggestion`:
  `char: "/"`, `startOfLine: false`, a `command` that deletes the suggestion
  range and invokes the chosen `SlashItem.run(editor)`, and a `render()` that
  mounts `SlashMenu` (React, via a portal) and forwards keyboard events
  (`onKeyDown` returns `true` when it handles `↑/↓/Enter/Tab/Esc`).
- The suggestion `items({ query })` calls `filterSlashItems(allItems, query)`.
  Item set = `[...(ai ? aiSlashItems(ai) : []), ...defaultSlashItems, ...(slashItems ?? [])]`
  (same merge order as today), passed to the extension from `GlassEditor`.
- **`items.ts`** — `SlashItem` gains `icon?: ReactNode`; `keywords?` now drives
  filtering. `filterSlashItems(items, query)`: case-insensitive match on
  `label` + `keywords`; empty query returns all; preserves group order.
- **`SlashMenu.tsx`** — grouped list (group header per `group`), each row shows
  `icon` + `label`, the active row highlighted; controlled by a `selectedIndex`
  the renderer updates on `↑/↓`. Mirrors the reference (AI group, Style group).

### Bubble / selection menu

- **`bubble/items.ts`** — `BubbleItem = { id; label; icon?; isActive?(editor): boolean; run(editor): void | Promise<void> }`.
  `defaultBubbleItems` = Bold, Italic, Link (Link opens the inline `LinkInput`).
- **`BubbleMenu.tsx`** — wraps `@tiptap/react`'s `BubbleMenu`; renders
  `[...defaultBubbleItems, ...(bubbleItems ?? [])]` as a styled pill; `isActive`
  toggles a pressed style. This is the seam for community AI selection menus.
- **`LinkInput.tsx`** — inline input shown in the bubble when Link is chosen:
  prefilled with the current href, `Enter` applies (`setLink`), `Esc` cancels,
  an "Unlink" affordance when a link is active. No native dialog.

### Ask-AI inline

- **`AskAiInput.tsx`** — a caret-anchored inline input ("Ask AI what you
  want…"); `Enter` submits → `ai.ask(contextText, instruction)`, shows a
  pending state, inserts the result at the cursor; `Esc` cancels. Rejections are
  caught and surfaced inline (consistent with "never throw into host"); nothing
  is inserted on failure. "Continue Writing" stays a one-shot `ai.continue`
  call (no input needed).

### Gutter `＋`

- **`Gutter.tsx`** — an absolutely-positioned `＋` in `.glass-editor`'s left
  gutter, vertically aligned to the current block (updates on selection change
  and block hover via the positioning helpers). Click focuses the block and
  inserts a `/` at the cursor, which opens the same suggestion popup/flow
  (single code path, no duplicate menu logic). A `⠿` drag slot is visually
  reserved but inert (deferred).

### `GlassEditor.tsx`

Composes the above. Removes the old fixed `.glass-editor__bar` button and the
`onKeyDown`/`slashOpen` hack. Props extend with `bubbleItems?: BubbleItem[]`.
The controlled-value sync, `onChange` ref, and `hasAi` reset behavior are
preserved.

## Public API changes

```ts
// new
export type BubbleItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void | Promise<void>;
};
export const defaultBubbleItems: BubbleItem[];

// changed
export type SlashItem = { /* …existing… */ icon?: React.ReactNode };
export function filterSlashItems(items: SlashItem[], query: string): SlashItem[];

// GlassEditorProps gains:
//   bubbleItems?: BubbleItem[]
```

`AiAdapter`, `defaultExtensions`, `defaultSlashItems`, `aiSlashItems`,
`GlassEditor`, `VERSION` remain exported (the guard test's stable-API set is
extended, not reduced). Re-adding `@tiptap/suggestion` is a dependency change;
the guard test for OSS-only still passes.

## Theming (CSS variables)

`.glass-editor` defines custom properties; light values are the default, a
`@media (prefers-color-scheme: dark)` block overrides them. Hosts override by
setting variables on `.glass-editor` (or a wrapper).

Token set (initial): `--glass-bg`, `--glass-fg`, `--glass-muted`,
`--glass-border`, `--glass-accent` (= `#6366F1`), `--glass-accent-fg`,
`--glass-radius`, `--glass-popup-bg`, `--glass-popup-fg`, `--glass-popup-border`,
`--glass-hover`, `--glass-shadow`.

Styled surfaces: editor content typography (heading scale, paragraph rhythm,
lists, task list, blockquote, code/code-block, `hr`), focus states, the bubble
pill (including the buttons inside it — fixes the unstyled-button bug), the
slash popup (grouped, rounded, shadowed), the gutter `＋`, the inline Link and
Ask-AI inputs. All keyed off the variables so a host restyles by overriding
tokens, not by fighting selectors.

## Data flow

1. User types `/` → suggestion plugin opens, captures query → `SlashMenu`
   renders filtered items at the caret.
2. `↑/↓` change `selectedIndex`; `Enter`/`Tab`/click → suggestion `command`
   deletes the `/`+query range and calls `item.run(editor)`.
3. AI items: `ai-continue` calls `ai.continue` immediately; `ai-ask` opens
   `AskAiInput`; on submit, `ai.ask` result is inserted. Errors → inline,
   nothing inserted.
4. Selection → `BubbleMenu` shows; Link opens `LinkInput`.
5. Caret/block change → `Gutter` repositions `＋`.
6. Every doc change → `onChange(editor.getJSON())` (unchanged); external `value`
   changes still sync in via the existing guarded effect.

## Error handling

- AI rejections (continue/ask) are caught; nothing is inserted; a minimal inline
  error is shown; never throws into the host.
- Positioning is defensive: if `coordsAtPos` throws or returns an off-screen
  rect, the popup is hidden rather than crashing.
- Empty Ask-AI / Link inputs cancel silently (no-op).

## Testing (TDD)

- `filterSlashItems`: label + keyword matching, case-insensitive, empty query,
  group-order preservation.
- `SlashCommand`: selecting an item deletes the `/`+query range and runs the
  item (assert resulting doc + that no stray `/` remains).
- Keyboard: `↑/↓` move selection; `Enter` selects; `Esc` closes (unit-level on
  `SlashMenu` with a fake suggestion props object where DOM-less).
- `BubbleMenu`: renders default + injected `bubbleItems`; `isActive` reflects
  state; Link opens `LinkInput`, apply sets a link, cancel doesn't.
- `AskAiInput`: submit calls `ai.ask` with the context+instruction and inserts;
  a rejecting adapter does not throw and inserts nothing.
- `Gutter`: clicking `＋` opens the slash menu.
- Guard tests unchanged and passing (OSS-only with `@tiptap/suggestion`).
- jsdom note: positioning relies on layout APIs jsdom lacks; tests mock the
  positioning helpers / TipTap menu wrappers where needed (as the existing
  GlassEditor tests already mock `BubbleMenu`). Behavior assertions target the
  command/filter/handler logic, not pixel positions.

## Demo

- Add the logo lockup to the demo header; light page chrome that follows the new
  light/dark theme. Keep the live-JSON panel. The mock adapter continues to back
  Continue/Ask so the inline Ask-AI flow is exercisable.

## Rollout

Single implementation plan, TDD per task. Version bump to `0.1.0` (additive API:
`bubbleItems`, `filterSlashItems`, `SlashItem.icon`, `BubbleItem`); no exports
removed. README/AGENTS updated: slash menu is now the real popup (move it out of
"roadmap"), document `bubbleItems` and the theming variables, and the "defaults +
hooks; rich AI menus & drag are community/v2" stance.
