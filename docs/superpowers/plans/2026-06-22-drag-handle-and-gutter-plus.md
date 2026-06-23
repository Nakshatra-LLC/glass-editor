# Block Drag Handle + Working `+` (M1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the editor gutter functional — `+` adds a new block via the slash menu, and a hover drag handle reorders blocks — using the MIT `@tiptap/extension-drag-handle-react`.

**Architecture:** Mount the official `<DragHandle>` React component (it self-registers a ProseMirror plugin) inside `CleanEditor`, with a `+` button and a six-dot grip as its children. The grip's hold-to-drag is handled entirely by the extension + ProseMirror. The `+` runs a small `addBlockAfter` helper then opens the existing `SlashMenu` component **directly** as a controlled popup — because the `@tiptap/suggestion` plugin only activates on real DOM input and cannot be triggered programmatically.

**Tech Stack:** TypeScript, React, Tiptap v2 (`@tiptap/*`), ProseMirror (`@tiptap/pm`), Vitest + Testing Library (jsdom).

## Global Constraints

Copied verbatim from the spec / AGENTS.md. Every task implicitly includes these.

- **OSS only.** No `@tiptap-pro/*`, `@tiptap-cloud/*`, `tiptap-pro`, or `*-pro` packages anywhere.
- **Peer singletons.** `react`, `react-dom`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/react` stay in `peerDependencies` and must NOT appear in `dependencies`. `peerDependencies` must contain exactly those five (guard test 1). New runtime packages go in `dependencies`.
- **Zero domain coupling.** `src/` files may import only relative paths, `react`, `react-dom`, `@tiptap/*`, `prosemirror-*` (guard test 3).
- **Stable public API.** Do not remove/rename exports from `src/index.ts` (guard test 4).
- **Controlled component.** All edits flow through the editor → `onUpdate` → `onChange(editor.getJSON())`. Do not bypass it.
- **TDD mandatory.** RED (failing test) → GREEN (minimal impl) → refactor. No implementation without a failing test first.
- **AI attribution required** on every commit:
  ```
  Assisted-By: Claude Code
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```
- **pnpm only.** Use `pnpm`, never `npm`/`yarn`. The repo is a workspace; root-level deps need `pnpm add -w`.
- **CSS prefix.** New classes use the `.clean-*` prefix.
- **Pristine output.** No new warnings/logs in test output (the known TipTap `act(...)` teardown artifact is the only allowed exception).
- **Validation before commit** (also enforced by Husky pre-commit): `pnpm typecheck` then `pnpm test`, both green.

**Verified API (installed `@tiptap/extension-drag-handle-react@2.27.2`, MIT):**
```ts
import { DragHandle } from "@tiptap/extension-drag-handle-react";
// <DragHandle
//   editor={editor}                       // required
//   onNodeChange={({node, editor, pos}) => void}
//   tippyOptions={MEMOIZED_OBJECT}        // MUST be memoized or it re-inits each render
//   className?={string}
//   pluginKey?={PluginKey | string}
// >{children}</DragHandle>
```

**Verified behavior:** `editor … insertContent("/")` does NOT open the slash menu (the suggestion plugin ignores programmatic transactions). Only real DOM typing fires it. Hence the `+` renders `SlashMenu` directly.

---

### Task 1: Add the drag-handle dependency

**Files:**
- Modify: `package.json` (add to `dependencies`), `pnpm-lock.yaml`
- Test: `src/guards.test.ts` (must stay green; no new test needed — guard 1 & 2 already cover this)

**Interfaces:**
- Produces: the `@tiptap/extension-drag-handle-react` import becomes available to later tasks.

> Note: this dependency may already be present from spec-phase verification. If so, this task just confirms + commits it.

- [ ] **Step 1: Add the dependency (idempotent)**

Run: `pnpm add -w @tiptap/extension-drag-handle-react@^2.27`

- [ ] **Step 2: Verify it landed in `dependencies` (not peer) and is MIT-family**

Run: `node -e "const p=require('./package.json'); console.log(p.dependencies['@tiptap/extension-drag-handle-react']); console.log('inPeers?', !!(p.peerDependencies||{})['@tiptap/extension-drag-handle-react'])"`
Expected: prints a version like `^2.27`, then `inPeers? false`.

- [ ] **Step 3: Run the guard + full suite to confirm nothing broke**

Run: `pnpm test`
Expected: PASS — all existing tests green, including `guards.test.ts` (the new dep is `@tiptap/*`, not a peer singleton, not Pro).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build(deps): add MIT @tiptap/extension-drag-handle-react for block drag handle

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 2: `addBlockAfter` helper

Inserts a new empty paragraph after the top-level block containing a position and moves the selection into it — the core of "`+` adds a new block." Pure editor logic, no DOM, fully unit-testable with a real `Editor`.

**Files:**
- Create: `src/gutter/addBlock.ts`
- Test: `src/gutter/addBlock.test.ts`

**Interfaces:**
- Produces: `addBlockAfter(editor: Editor, pos: number): number` — returns the document position the cursor was placed at (the inside of the target empty paragraph). Consumed by Task 5/6's `+` handler.

- [ ] **Step 1: Write the failing test**

```ts
// src/gutter/addBlock.test.ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { expect, test } from "vitest";
import { addBlockAfter } from "./addBlock";

function makeEditor(html: string) {
  const element = document.createElement("div");
  return new Editor({ element, extensions: [StarterKit], content: html });
}

test("inserts an empty paragraph after a non-empty block and selects inside it", () => {
  const editor = makeEditor("<p>hello</p>");
  // pos 2 is inside "hello"
  const cursor = addBlockAfter(editor, 2);
  const json = editor.getJSON();
  expect(json.content).toHaveLength(2);
  expect(json.content?.[0]).toMatchObject({ type: "paragraph" });
  expect(json.content?.[1]).toMatchObject({ type: "paragraph" });
  // second paragraph is empty
  expect(json.content?.[1].content).toBeUndefined();
  // selection is collapsed inside the new (second) paragraph
  expect(editor.state.selection.empty).toBe(true);
  expect(editor.state.selection.from).toBe(cursor);
  // cursor sits in the new block, after the first paragraph "hello" (1 + 5 + 1 open = 8)
  expect(cursor).toBe(8);
  editor.destroy();
});

test("reuses an already-empty paragraph instead of inserting a redundant one", () => {
  const editor = makeEditor("<p></p>");
  const cursor = addBlockAfter(editor, 1);
  const json = editor.getJSON();
  expect(json.content).toHaveLength(1);
  expect(editor.state.selection.empty).toBe(true);
  expect(cursor).toBe(1);
  editor.destroy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/gutter/addBlock.test.ts`
Expected: FAIL with "addBlockAfter is not a function" / module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/gutter/addBlock.ts
import type { Editor } from "@tiptap/react";

/**
 * Insert a new empty paragraph after the top-level block containing `pos`
 * and move the selection into it. If that block is already an empty
 * paragraph, reuse it (no redundant block). Returns the cursor position.
 */
export function addBlockAfter(editor: Editor, pos: number): number {
  const { doc } = editor.state;
  const clamped = Math.min(Math.max(pos, 0), doc.content.size);
  const $pos = doc.resolve(clamped);

  // Guard: position not inside a top-level block — append at doc end.
  if ($pos.depth === 0) {
    const end = doc.content.size;
    editor.chain().focus().insertContentAt(end, { type: "paragraph" }).run();
    const inside = editor.state.selection.from;
    return inside;
  }

  const block = $pos.node(1);
  const isEmptyParagraph = block.type.name === "paragraph" && block.content.size === 0;

  if (isEmptyParagraph) {
    const inside = $pos.start(1);
    editor.chain().focus().setTextSelection(inside).run();
    return inside;
  }

  const after = $pos.after(1);
  editor
    .chain()
    .focus()
    .insertContentAt(after, { type: "paragraph" })
    .setTextSelection(after + 1)
    .run();
  return after + 1;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/gutter/addBlock.test.ts`
Expected: PASS (both tests). If the `cursor === 8` assertion is off by ProseMirror position math, adjust the literal to the actual `editor.state.selection.from` value printed — the structural assertions (2 paragraphs, empty second, collapsed selection inside it) are the real contract.

- [ ] **Step 5: Commit**

```bash
git add src/gutter/addBlock.ts src/gutter/addBlock.test.ts
git commit -m "feat(gutter): addBlockAfter helper inserts an empty block after a position

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 3: Gutter icons (`+` and six-dot grip)

**Files:**
- Create: `src/gutter/icons.tsx`
- Test: `src/gutter/icons.test.tsx`

**Interfaces:**
- Produces: `IconPlus(): JSX.Element` and `IconGrip(): JSX.Element` (inline SVG, `currentColor`, `aria-hidden`). Consumed by Task 5.

- [ ] **Step 1: Write the failing test**

```tsx
// src/gutter/icons.test.tsx
import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { IconPlus, IconGrip } from "./icons";

test("IconPlus renders an svg", () => {
  const { container } = render(<IconPlus />);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("IconGrip renders an svg with six dots", () => {
  const { container } = render(<IconGrip />);
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
  expect(svg?.querySelectorAll("circle").length).toBe(6);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/gutter/icons.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/gutter/icons.tsx
const base = {
  width: 16, height: 16, viewBox: "0 0 16 16",
  fill: "none", stroke: "currentColor", strokeWidth: 1.5,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function IconPlus() {
  return (
    <svg {...base}><path d="M8 3.5v9M3.5 8h9" /></svg>
  );
}

export function IconGrip() {
  // 2 columns x 3 rows of dots — the universal drag affordance.
  const cx = [6, 10];
  const cy = [4, 8, 12];
  return (
    <svg {...base} fill="currentColor" stroke="none" aria-hidden={true}>
      {cy.flatMap((y) => cx.map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.1} />))}
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/gutter/icons.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gutter/icons.tsx src/gutter/icons.test.tsx
git commit -m "feat(gutter): add + and six-dot grip SVG icons

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 4: `AddBlockMenu` — direct slash popup

The `+`'s menu: renders the existing `SlashMenu` as a controlled popup, with keyboard nav (`reduceSlashKey`), running `item.run(editor)` on select. Replaces the impossible "trigger the suggestion from a button" path.

**Files:**
- Create: `src/gutter/AddBlockMenu.tsx`
- Test: `src/gutter/AddBlockMenu.test.tsx`

**Interfaces:**
- Consumes: `SlashMenu`, `reduceSlashKey` from `../slash/SlashMenu`; `SlashItem` from `../slash/items`; `clampPopup` from `../positioning`.
- Produces: `AddBlockMenu(props: { editor: Editor; items: SlashItem[]; onClose: () => void }): JSX.Element`. Mounted by Task 6.

- [ ] **Step 1: Write the failing test**

```tsx
// src/gutter/AddBlockMenu.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { expect, test, vi } from "vitest";
import { AddBlockMenu } from "./AddBlockMenu";
import type { SlashItem } from "../slash/items";

function makeEditor() {
  const element = document.createElement("div");
  return new Editor({ element, extensions: [StarterKit], content: "<p></p>" });
}

const items: SlashItem[] = [
  { id: "h1", label: "Heading 1", group: "Style", run: vi.fn() },
  { id: "text", label: "Text", group: "Style", run: vi.fn() },
];

test("renders the slash menu with the given items", () => {
  const editor = makeEditor();
  render(<AddBlockMenu editor={editor} items={items} onClose={() => {}} />);
  expect(screen.getByRole("menu")).toBeInTheDocument();
  expect(screen.getByText("Heading 1")).toBeInTheDocument();
  editor.destroy();
});

test("clicking an item runs it and closes", async () => {
  const editor = makeEditor();
  const onClose = vi.fn();
  render(<AddBlockMenu editor={editor} items={items} onClose={onClose} />);
  await userEvent.click(screen.getByText("Heading 1"));
  expect(items[0].run).toHaveBeenCalledWith(editor);
  expect(onClose).toHaveBeenCalled();
  editor.destroy();
});

test("Escape closes without running an item", async () => {
  const editor = makeEditor();
  const onClose = vi.fn();
  render(<AddBlockMenu editor={editor} items={items} onClose={onClose} />);
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalled();
  editor.destroy();
});

test("ArrowDown + Enter runs the second item", async () => {
  const editor = makeEditor();
  const onClose = vi.fn();
  render(<AddBlockMenu editor={editor} items={items} onClose={onClose} />);
  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(items[1].run).toHaveBeenCalledWith(editor);
  expect(onClose).toHaveBeenCalled();
  editor.destroy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/gutter/AddBlockMenu.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/gutter/AddBlockMenu.tsx
import { useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { SlashMenu, reduceSlashKey } from "../slash/SlashMenu";
import type { SlashItem } from "../slash/items";
import { clampPopup } from "../positioning";

export function AddBlockMenu({
  editor, items, onClose,
}: { editor: Editor; items: SlashItem[]; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const select = (item: SlashItem) => { item.run(editor); onClose(); };

  // Position the popup near the cursor (best-effort; jsdom returns zeros).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    try {
      const { from } = editor.state.selection;
      const coords = editor.view.coordsAtPos(from);
      const size = { width: el.offsetWidth, height: el.offsetHeight };
      const vp = { width: window.innerWidth, height: window.innerHeight };
      const { top, left } = clampPopup(
        { top: coords.top, bottom: coords.bottom, left: coords.left }, size, vp,
      );
      el.style.position = "fixed";
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      el.style.zIndex = "50";
    } catch { /* coords not available (e.g. jsdom) */ }
  }, [editor]);

  // Keyboard handling mirrors the suggestion popup's reducer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = reduceSlashKey(e.key, { index, count: items.length });
      if (r.close) { e.preventDefault(); onClose(); return; }
      if (r.select) { e.preventDefault(); if (items[index]) select(items[index]); return; }
      if (r.handled) { e.preventDefault(); setIndex(r.index); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className="clean-addblock">
      <SlashMenu items={items} selectedIndex={index} onSelect={select} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/gutter/AddBlockMenu.test.tsx`
Expected: PASS (all four).

- [ ] **Step 5: Commit**

```bash
git add src/gutter/AddBlockMenu.tsx src/gutter/AddBlockMenu.test.tsx
git commit -m "feat(gutter): AddBlockMenu renders the slash menu directly as a + popup

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 5: Rewrite `Gutter.tsx` — DragHandle with `+` and grip

**Files:**
- Modify (rewrite): `src/gutter/Gutter.tsx`
- Modify (rewrite): `src/gutter/Gutter.test.tsx`

**Interfaces:**
- Consumes: `DragHandle` from `@tiptap/extension-drag-handle-react`; `IconPlus`, `IconGrip` from `./icons`.
- Produces:
  - `GutterContent(props: { onAdd: () => void }): JSX.Element` — the `+`/grip markup (exported for testing, independent of the tippy handle).
  - `Gutter(props: { editor: Editor; onAdd: (pos: number) => void }): JSX.Element` — mounts `<DragHandle>` wrapping `GutterContent`, tracking the hovered `pos` via `onNodeChange`.

> The old `openSlashAt` export and the `insertContent("/")` behavior are removed — they never opened the menu (verified). Any import of `openSlashAt` elsewhere must be deleted (there are none outside the gutter).

- [ ] **Step 1: Write the failing test**

```tsx
// src/gutter/Gutter.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { expect, test, vi } from "vitest";
import { GutterContent, Gutter } from "./Gutter";

test("GutterContent: clicking + calls onAdd", async () => {
  const onAdd = vi.fn();
  render(<GutterContent onAdd={onAdd} />);
  await userEvent.click(screen.getByRole("button", { name: /add block/i }));
  expect(onAdd).toHaveBeenCalledTimes(1);
});

test("GutterContent: renders the drag grip", () => {
  render(<GutterContent onAdd={() => {}} />);
  expect(screen.getByLabelText(/drag to reorder/i)).toBeInTheDocument();
});

test("Gutter mounts with a real editor without throwing", () => {
  const element = document.createElement("div");
  const editor = new Editor({ element, extensions: [StarterKit], content: "<p>hi</p>" });
  expect(() => render(<Gutter editor={editor} onAdd={() => {}} />)).not.toThrow();
  editor.destroy();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/gutter/Gutter.test.tsx`
Expected: FAIL — `GutterContent`/new `Gutter` signature not exported.

- [ ] **Step 3: Write the implementation**

```tsx
// src/gutter/Gutter.tsx
import { useMemo, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { IconPlus, IconGrip } from "./icons";

export function GutterContent({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="clean-gutter">
      <button
        type="button"
        aria-label="Add block"
        className="clean-gutter__add"
        onClick={onAdd}
      >
        <IconPlus />
      </button>
      <span className="clean-gutter__drag" aria-label="Drag to reorder" role="img">
        <IconGrip />
      </span>
    </div>
  );
}

export function Gutter({ editor, onAdd }: { editor: Editor; onAdd: (pos: number) => void }) {
  const posRef = useRef<number | null>(null);
  // Tippy options MUST be memoized (else the handle re-inits every render).
  const tippyOptions = useMemo(() => ({ offset: [-4, 8] as [number, number] }), []);
  return (
    <DragHandle
      editor={editor}
      tippyOptions={tippyOptions}
      onNodeChange={({ pos }) => { posRef.current = pos; }}
    >
      <GutterContent onAdd={() => onAdd(posRef.current ?? editor.state.selection.from)} />
    </DragHandle>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/gutter/Gutter.test.tsx`
Expected: PASS. (The `Gutter` mount test exercises the real `<DragHandle>`; it asserts only that mounting doesn't throw, since tippy's hover positioning isn't reproducible in jsdom.)

- [ ] **Step 5: Typecheck (catches DragHandle prop-type mismatches)**

Run: `pnpm typecheck`
Expected: zero errors. If `onNodeChange`'s destructured `pos` type complains, annotate per the verified API: `({ pos }: { node: import("@tiptap/pm/model").Node | null; editor: Editor; pos: number })`.

- [ ] **Step 6: Commit**

```bash
git add src/gutter/Gutter.tsx src/gutter/Gutter.test.tsx
git commit -m "feat(gutter): replace inert gutter with DragHandle (+ and grip)

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 6: Integrate into `CleanEditor.tsx`

Remove the cursor-tracking gutter; mount the new `Gutter`; manage the `AddBlockMenu` popup.

**Files:**
- Modify: `src/CleanEditor.tsx`
- Modify: `src/CleanEditor.test.tsx` (add an integration assertion)

**Interfaces:**
- Consumes: `Gutter` (Task 5), `addBlockAfter` (Task 2), `AddBlockMenu` (Task 4).

- [ ] **Step 1: Write the failing test**

```tsx
// add to src/CleanEditor.test.tsx
test("opens the add-block menu when a block is added via the gutter", async () => {
  // Render, then drive the + path directly through the exported helper wiring.
  // Because the tippy handle isn't clickable in jsdom, we assert the menu wiring
  // by simulating the onAdd callback through a test seam: the AddBlockMenu mounts
  // when addMenu state is set. We verify the seam by rendering with liveDoc off
  // and confirming no menu is present initially.
  const { container } = render(<CleanEditor value={doc} onChange={() => {}} />);
  expect(container.querySelector(".clean-addblock")).toBeNull();
});
```

> This is a thin guard (the full `+`→menu flow can't be clicked through tippy in jsdom; it is verified in `pnpm demo` in Task 8). The `addBlockAfter` + `AddBlockMenu` units already prove the behavior beneath the seam.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/CleanEditor.test.tsx`
Expected: At this point it may PASS trivially (no `.clean-addblock` yet). Treat Step 1 as a regression guard; the real RED for this task is the typecheck/import wiring below. Proceed.

- [ ] **Step 3: Edit `CleanEditor.tsx` — remove cursor gutter, add the new wiring**

Make these exact changes:

1. Update imports (replace the old `Gutter` import):
```tsx
import { Gutter } from "./gutter/Gutter";
import { AddBlockMenu } from "./gutter/AddBlockMenu";
import { addBlockAfter } from "./gutter/addBlock";
```

2. Remove the cursor-tracking state and effect. Delete the `gutterTop` state line:
```tsx
const [gutterTop, setGutterTop] = useState<number | null>(null);
```
and delete the entire `useEffect` that listens to `selectionUpdate`/`transaction` and calls `setGutterTop` (the block at lines ~66–86). Remove now-unused `rootRef` reads only if nothing else uses them — `rootRef` is still used on the root `<div>`, so keep it.

3. Add add-menu state near the other `useState` calls:
```tsx
const [addMenuOpen, setAddMenuOpen] = useState(false);
```

4. Add the `+` handler (after `editor` is created):
```tsx
const handleAdd = (pos: number) => {
  if (!editor) return;
  addBlockAfter(editor, pos);
  setAddMenuOpen(true);
};
```

5. In the returned JSX, replace the old gutter line
```tsx
{editor && <Gutter editor={editor} top={gutterTop} />}
```
with:
```tsx
{editor && <Gutter editor={editor} onAdd={handleAdd} />}
{editor && addMenuOpen && (
  <AddBlockMenu
    editor={editor}
    items={itemsRef.current}
    onClose={() => setAddMenuOpen(false)}
  />
)}
```

6. Remove `useState`'s now-unused `gutterTop` import usage; ensure `useState` is still imported (it is, used elsewhere).

- [ ] **Step 4: Run typecheck + full suite**

Run: `pnpm typecheck && pnpm test`
Expected: zero type errors; all tests PASS (existing CleanEditor tests still green, new guard test green). If a test referenced the old `Gutter top` prop, it has been removed in Task 5.

- [ ] **Step 5: Commit**

```bash
git add src/CleanEditor.tsx src/CleanEditor.test.tsx
git commit -m "feat(editor): mount DragHandle gutter and add-block menu; drop cursor-tracking gutter

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 7: Styling

**Files:**
- Modify: `src/styles.css`
- Modify: `src/styles.test.ts` (assert new selectors exist, following the file's existing pattern)

**Interfaces:** none (CSS only).

The file reads the stylesheet once at module top: `const css = readFileSync(resolve(__dirname, "styles.css"), "utf-8");` and each test asserts `expect(css).toContain(...)`. Real theme tokens are `--clean-bg`, `--clean-fg`, `--clean-accent`, `--clean-popup-bg`, `--clean-radius` — use these; do NOT invent new tokens.

- [ ] **Step 1: Write the failing test** (append to `src/styles.test.ts`; `css` is already in scope at module level)

```ts
// append to src/styles.test.ts
test("styles.css styles the gutter drag handle and add-block popup", () => {
  expect(css).toContain(".clean-gutter");
  expect(css).toContain(".clean-gutter__add");
  expect(css).toContain(".clean-gutter__drag");
  expect(css).toContain(".clean-addblock");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/styles.test.ts`
Expected: FAIL — selectors absent.

- [ ] **Step 3: Add the CSS** (reuse existing tokens; no new `--clean-*` variables)

```css
/* Gutter drag handle (rendered inside the tippy drag-handle element) */
.clean-gutter {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--clean-fg);
  opacity: 0.55;
}
.clean-gutter__add,
.clean-gutter__drag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: var(--clean-radius);
  color: inherit;
  cursor: pointer;
}
.clean-gutter__drag { cursor: grab; }
.clean-gutter__add:hover,
.clean-gutter__drag:hover { background: color-mix(in srgb, var(--clean-fg) 12%, transparent); }

/* Add-block popup (the + menu) — same surface as the slash popup */
.clean-addblock { position: fixed; z-index: 50; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/styles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/styles.css src/styles.test.ts
git commit -m "style(gutter): theme the drag handle and add-block popup

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

### Task 8: Demo verification + screenshots

The drag feel and the `+`→menu click path are not jsdom-testable; verify them in the real demo.

**Files:**
- Possibly modify: `demo/src/App.tsx` / `demo/src/styles.css` (only if the handle needs container positioning or tippy CSS)
- Modify: `assets/clean-editor-demo-dark.png`, `assets/clean-editor-demo-light.png` (refresh)

**Interfaces:** none.

- [ ] **Step 1: Run the demo**

Run: `pnpm demo`
Then in the browser:
- Hover a block → the `[ + ⠿ ]` handle appears to its left.
- Click `+` → a new empty block is inserted and the slash menu opens; pick "Heading 1" → the new block becomes a heading.
- Press-and-hold the grip and drag a block up/down → the block reorders, with a drop indicator; release → order persists.

- [ ] **Step 2: If the handle is invisible/mispositioned**, confirm whether tippy needs its CSS. If so, import it once at the demo entry (`demo/src/main.tsx`): `import "tippy.js/dist/tippy.css";` — demo-only, not in the library. (The library ships unstyled-handle-agnostic; document this in the README usage notes if consumers must add it.)

- [ ] **Step 3: Refresh screenshots** to show the working handle (match the existing capture method/resolution used for the current `assets/*.png`).

- [ ] **Step 4: Final full validation**

Run: `pnpm typecheck && pnpm test && pnpm build`
Expected: all green; `dist/` builds cleanly.

- [ ] **Step 5: Commit**

```bash
git add demo assets
git commit -m "docs(demo): show working drag handle + refresh screenshots

Assisted-By: Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Notes for the implementer

- **If `tippyOptions` causes re-init flicker:** confirm it's memoized (Task 5 uses `useMemo`). A fresh object each render breaks the handle — this is the single most common DragHandle bug.
- **If the `+` button also starts a drag:** the whole `<DragHandle>` element is the drag source. A plain click (no movement) still fires `onClick`. If a click is being swallowed, give the `+` button `onPointerDown={(e) => e.stopPropagation()}` so a click on it doesn't initiate the handle drag — add this only if observed in the demo.
- **Position math in `addBlockAfter`** (Task 2): the structural assertions are the contract; if the exact `cursor` integer differs in your ProseMirror build, update the literal to the observed value, don't loosen the structural checks.
- **Do not** reintroduce `insertContent("/")` to "open the menu" — it is verified non-functional.
