# Glass Editor (`@nakshatra/glass-editor`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
>
> Implements `docs/superpowers/specs/2026-06-22-glass-editor-design.md`. Goal: a basic, publishable v1.

**Goal:** A standalone, publishable React+TipTap editor library — `<GlassEditor>` with a `/`
slash menu, default blocks, bubble toolbar, and an injected AI adapter (Continue/Ask AI) — built
on OSS TipTap, zero domain coupling.

**Architecture:** Plain **pnpm + Vite (library mode)** repo (not nx). Vite builds ESM + `.d.ts`;
ProseMirror/TipTap-core and React are **peerDependencies** (host provides singletons — duplicate
ProseMirror breaks editing). vitest + Testing Library + jsdom for tests.

**Tech Stack:** React 18, TypeScript (strict), Vite lib mode + `vite-plugin-dts`, `@tiptap/react`
+ StarterKit + free extensions + `@tiptap/suggestion`, vitest.

## Global Constraints
- **OSS only** — TipTap StarterKit + free MIT extensions + `@tiptap/suggestion`. No Pro/Cloud.
- **Zero domain coupling** — no host backend/domain imports; AI/slash/extensions are injected.
- **Peer deps:** `react`, `react-dom`, `@tiptap/react`, `@tiptap/core`, `@tiptap/pm` are
  peerDependencies (singletons). Specific extensions may be regular deps.
- Controlled: `value` (PM JSON) + `onChange`. TDD mandatory. MIT, public repo — no private/app
  names in code or docs. Commits carry no AI attribution. Run from repo root
  `/Users/sreekanthayydevara/code/nakshatra.io/glass-editor`.
- Gate per task: `pnpm test` (vitest) + `pnpm typecheck` (tsc --noEmit) green before commit.

---

### Task 1: Scaffold the Vite library + passing smoke test

**Files:** Create `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.setup.ts`,
`src/index.ts`, `src/index.test.ts`.

- [ ] **Step 1: `package.json`**

```json
{
  "name": "@nakshatra/glass-editor",
  "version": "0.0.1",
  "description": "WYSIWYG editor built with TipTap StarterKit (OSS) — pluggable blocks, slash menu, injected AI adapter.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": { ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }, "./styles.css": "./dist/styles.css" },
  "files": ["dist"],
  "sideEffects": ["**/*.css"],
  "scripts": {
    "build": "vite build && tsc -p tsconfig.build.json --emitDeclarationOnly",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tiptap/core": "^2.8.0",
    "@tiptap/pm": "^2.8.0",
    "@tiptap/react": "^2.8.0"
  },
  "dependencies": {
    "@tiptap/starter-kit": "^2.8.0",
    "@tiptap/suggestion": "^2.8.0",
    "@tiptap/extension-link": "^2.8.0",
    "@tiptap/extension-task-list": "^2.8.0",
    "@tiptap/extension-task-item": "^2.8.0",
    "@tiptap/extension-image": "^2.8.0",
    "@tiptap/extension-placeholder": "^2.8.0"
  },
  "devDependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@tiptap/core": "^2.8.0",
    "@tiptap/pm": "^2.8.0",
    "@tiptap/react": "^2.8.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.5.0",
    "jsdom": "^25.0.0",
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vite-plugin-dts": "^4.0.0",
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler",
    "jsx": "react-jsx", "strict": true, "declaration": true, "esModuleInterop": true,
    "skipLibCheck": true, "lib": ["ES2022", "DOM"], "types": ["vitest/globals"]
  },
  "include": ["src"]
}
```

(`tsconfig.build.json`: `{ "extends": "./tsconfig.json", "compilerOptions": { "emitDeclarationOnly": true, "outDir": "dist" }, "exclude": ["**/*.test.*", "vitest.setup.ts"] }`.)

- [ ] **Step 3: `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true, tsconfigPath: "./tsconfig.build.json" })],
  build: {
    lib: { entry: "src/index.ts", formats: ["es"], fileName: "index" },
    rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime", /^@tiptap\//, /^prosemirror-/] },
  },
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"], globals: true, include: ["src/**/*.test.{ts,tsx}"] },
});
```

> Add `@vitejs/plugin-react` to devDependencies in Step 1 (`"@vitejs/plugin-react": "^4.3.0"`).

- [ ] **Step 4: `vitest.setup.ts`** → `import "@testing-library/jest-dom/vitest";`

- [ ] **Step 5: `src/index.ts`** → `export const VERSION = "0.0.1";`

- [ ] **Step 6: failing test `src/index.test.ts`**

```ts
import { VERSION } from "./index";
test("exports a version", () => { expect(VERSION).toBe("0.0.1"); });
```

- [ ] **Step 7: Install + verify** — `pnpm install && pnpm test && pnpm typecheck` → PASS

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: scaffold vite library (@nakshatra/glass-editor)"
```

---

### Task 2: `defaultExtensions`

**Files:** Create `src/extensions.ts`, `src/extensions.test.ts`. Modify `src/index.ts` (export).

**Interfaces:** Produces `defaultExtensions(opts?: { placeholder?: string }): Extension[]`.

- [ ] **Step 1: failing test** — `src/extensions.test.ts`

```ts
import { defaultExtensions } from "./extensions";
test("includes core blocks and a placeholder", () => {
  const names = defaultExtensions({ placeholder: "Write…" }).map((e) => e.name);
  expect(names).toContain("starterKit");
  expect(names).toContain("taskList");
  expect(names).toContain("placeholder");
});
```

- [ ] **Step 2: Run → FAIL** (`pnpm test`)

- [ ] **Step 3: `src/extensions.ts`**

```ts
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extension } from "@tiptap/core";

export function defaultExtensions(opts?: { placeholder?: string }): Extension[] {
  return [
    StarterKit,
    Link.configure({ openOnClick: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Image,
    Placeholder.configure({ placeholder: opts?.placeholder ?? "Write something, or press / for blocks…" }),
  ] as unknown as Extension[];
}
```

- [ ] **Step 4: Run → PASS** + `pnpm typecheck`; export from `index.ts`: `export { defaultExtensions } from "./extensions";`
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: defaultExtensions (OSS tiptap set)"`

---

### Task 3: Slash items + types (`SlashItem`, `defaultSlashItems`)

**Files:** Create `src/slash/items.ts`, `src/slash/items.test.ts`. Modify `src/index.ts`.

**Interfaces:** Produces `type SlashItem = { id; label; group?; keywords?; run(editor) }`;
`defaultSlashItems: SlashItem[]` (Heading 1–3, Bullet/Numbered/To-do, Quote, Code, Divider).

- [ ] **Step 1: failing test** — `src/slash/items.test.ts`

```ts
import { defaultSlashItems } from "./items";

function fakeEditor() {
  const calls: string[] = [];
  const chain: any = new Proxy({}, { get: (_t, p) => (..._a: unknown[]) => { if (p !== "run" && p !== "focus") calls.push(String(p)); return chain; } });
  return { calls, chain: () => chain } as any;
}

test("ships block items that run editor commands", () => {
  const ids = defaultSlashItems.map((i) => i.id);
  expect(ids).toEqual(expect.arrayContaining(["h2", "bulletList", "taskList", "codeBlock", "divider"]));
  const ed = fakeEditor();
  defaultSlashItems.find((i) => i.id === "h2")!.run(ed);
  expect(ed.calls).toContain("toggleHeading");
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: `src/slash/items.ts`**

```ts
import type { Editor } from "@tiptap/react";

export type SlashItem = {
  id: string;
  label: string;
  group?: string;
  keywords?: string[];
  run: (editor: Editor) => void;
};

const c = (e: Editor) => e.chain().focus();

export const defaultSlashItems: SlashItem[] = [
  { id: "paragraph", label: "Text", group: "Blocks", run: (e) => c(e).setParagraph().run() },
  { id: "h1", label: "Heading 1", group: "Blocks", run: (e) => c(e).toggleHeading({ level: 1 }).run() },
  { id: "h2", label: "Heading 2", group: "Blocks", run: (e) => c(e).toggleHeading({ level: 2 }).run() },
  { id: "h3", label: "Heading 3", group: "Blocks", run: (e) => c(e).toggleHeading({ level: 3 }).run() },
  { id: "bulletList", label: "Bullet List", group: "Blocks", run: (e) => c(e).toggleBulletList().run() },
  { id: "orderedList", label: "Numbered List", group: "Blocks", run: (e) => c(e).toggleOrderedList().run() },
  { id: "taskList", label: "To-do List", group: "Blocks", run: (e) => c(e).toggleTaskList().run() },
  { id: "blockquote", label: "Quote", group: "Blocks", run: (e) => c(e).toggleBlockquote().run() },
  { id: "codeBlock", label: "Code", group: "Blocks", run: (e) => c(e).toggleCodeBlock().run() },
  { id: "divider", label: "Divider", group: "Blocks", run: (e) => c(e).setHorizontalRule().run() },
];
```

- [ ] **Step 4: Run → PASS** + typecheck; export `SlashItem`, `defaultSlashItems` from `index.ts`.
- [ ] **Step 5: Commit** — `git commit -am "feat: SlashItem type + default block items"`

---

### Task 4: `aiSlashItems(adapter)` + `AiAdapter`

**Files:** Create `src/ai/aiSlashItems.ts`, `src/ai/aiSlashItems.test.ts`. Modify `src/index.ts`.

**Interfaces:** Produces `type AiAdapter = { continue(context): Promise<string>; ask(context, instruction): Promise<string> }`; `aiSlashItems(ai: AiAdapter): SlashItem[]` — "Continue Writing", "Ask AI".

- [ ] **Step 1: failing test** — `src/ai/aiSlashItems.test.ts`

```ts
import { vi, expect, test } from "vitest";
import { aiSlashItems } from "./aiSlashItems";

function fakeEditor() {
  const inserted: string[] = [];
  return { getText: () => "Seed.", commands: { insertContent: (t: string) => inserted.push(t) }, inserted } as any;
}

test("Continue Writing calls adapter.continue and inserts the result", async () => {
  const ai = { continue: vi.fn().mockResolvedValue(" More."), ask: vi.fn() };
  const ed = fakeEditor();
  const item = aiSlashItems(ai).find((i) => i.id === "ai-continue")!;
  await item.run(ed);
  expect(ai.continue).toHaveBeenCalledWith("Seed.");
  expect(ed.inserted).toContain(" More.");
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: `src/ai/aiSlashItems.ts`**

```ts
import type { Editor } from "@tiptap/react";
import type { SlashItem } from "../slash/items";

export type AiAdapter = {
  continue: (context: string) => Promise<string>;
  ask: (context: string, instruction: string) => Promise<string>;
};

export function aiSlashItems(ai: AiAdapter): SlashItem[] {
  return [
    {
      id: "ai-continue", label: "Continue Writing", group: "AI",
      run: async (e: Editor) => { const t = await ai.continue(e.getText()); e.commands.insertContent(t); },
    },
    {
      id: "ai-ask", label: "Ask AI", group: "AI",
      run: async (e: Editor) => {
        const instruction = window.prompt("Ask AI to…");
        if (!instruction) return;
        const t = await ai.ask(e.getText(), instruction);
        e.commands.insertContent(t);
      },
    },
  ];
}
```

> `SlashItem.run` returning a Promise is fine (the menu ignores the return). If strict typing complains, widen `run` to `(editor: Editor) => void | Promise<void>` in `items.ts`.

- [ ] **Step 4: Run → PASS** + typecheck; export `AiAdapter`, `aiSlashItems` from `index.ts`.
- [ ] **Step 5: Commit** — `git commit -am "feat: aiSlashItems (Continue Writing / Ask AI) from injected adapter"`

---

### Task 5: `SlashMenu` component

**Files:** Create `src/slash/SlashMenu.tsx`, `src/slash/SlashMenu.test.tsx`.

**Interfaces:** Produces `SlashMenu({ items, editor, open, onClose })` — grouped list; clicking an item runs it (with the editor) and closes. (v1: a simple controlled menu; a caret-anchored `@tiptap/suggestion` popup is a fast-follow.)

- [ ] **Step 1: failing test** — `src/slash/SlashMenu.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { SlashMenu } from "./SlashMenu";
import type { SlashItem } from "./items";

test("runs the clicked item with the editor and closes", async () => {
  const run = vi.fn();
  const onClose = vi.fn();
  const items: SlashItem[] = [{ id: "h2", label: "Heading 2", group: "Blocks", run }];
  const editor = {} as any;
  render(<SlashMenu items={items} editor={editor} open onClose={onClose} />);
  await userEvent.click(screen.getByRole("button", { name: "Heading 2" }));
  expect(run).toHaveBeenCalledWith(editor);
  expect(onClose).toHaveBeenCalled();
});

test("renders nothing when closed", () => {
  render(<SlashMenu items={[]} editor={{} as any} open={false} onClose={() => {}} />);
  expect(screen.queryByRole("menu")).toBeNull();
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: `src/slash/SlashMenu.tsx`**

```tsx
import type { Editor } from "@tiptap/react";
import type { SlashItem } from "./items";

export function SlashMenu({ items, editor, open, onClose }: { items: SlashItem[]; editor: Editor; open: boolean; onClose: () => void }) {
  if (!open) return null;
  const groups = Array.from(new Set(items.map((i) => i.group ?? "Blocks")));
  return (
    <div role="menu" className="glass-slash">
      {groups.map((g) => (
        <div key={g} className="glass-slash__group">
          <div className="glass-slash__label">{g}</div>
          {items.filter((i) => (i.group ?? "Blocks") === g).map((i) => (
            <button key={i.id} type="button" className="glass-slash__item" onClick={() => { i.run(editor); onClose(); }}>{i.label}</button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run → PASS** + typecheck.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: SlashMenu component"`

---

### Task 6: `GlassEditor` component (compose it all)

**Files:** Create `src/GlassEditor.tsx`, `src/GlassEditor.test.tsx`, `src/styles.css`. Modify `src/index.ts`.

**Interfaces:** Produces `GlassEditor(props: GlassEditorProps)` — controlled editor with bubble menu + slash menu (default items + `aiSlashItems(ai)` when `ai` given) + injected `extensions`/`slashItems`.

- [ ] **Step 1: failing test** — `src/GlassEditor.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { GlassEditor } from "./GlassEditor";

test("renders the doc content", async () => {
  render(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] }} onChange={() => {}} />);
  expect(await screen.findByText("Hello")).toBeInTheDocument();
});

test("AI slash items appear only when an adapter is provided", async () => {
  const ai = { continue: vi.fn(), ask: vi.fn() };
  const { rerender } = render(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph" }] }} onChange={() => {}} />);
  // open the menu via the exposed control (a "/" button for testability)
  (await screen.findByRole("button", { name: /insert block/i })).click();
  expect(screen.queryByRole("button", { name: /continue writing/i })).toBeNull();
  rerender(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph" }] }} onChange={() => {}} ai={ai} />);
  (await screen.findByRole("button", { name: /insert block/i })).click();
  expect(await screen.findByRole("button", { name: /continue writing/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: `src/GlassEditor.tsx`**

```tsx
import { useState } from "react";
import { useEditor, EditorContent, BubbleMenu, type Content, type Extension, type JSONContent } from "@tiptap/react";
import { defaultExtensions } from "./extensions";
import { defaultSlashItems, type SlashItem } from "./slash/items";
import { aiSlashItems, type AiAdapter } from "./ai/aiSlashItems";
import { SlashMenu } from "./slash/SlashMenu";

export type GlassEditorProps = {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  ai?: AiAdapter;
  extensions?: Extension[];
  slashItems?: SlashItem[];
  placeholder?: string;
  className?: string;
  editable?: boolean;
};

export function GlassEditor({ value, onChange, ai, extensions, slashItems, placeholder, className, editable = true }: GlassEditorProps) {
  const [slashOpen, setSlashOpen] = useState(false);
  const editor = useEditor({
    editable,
    extensions: extensions ?? defaultExtensions({ placeholder }),
    content: value as Content,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: { attributes: { class: "glass-editor__content" } },
  });
  const items: SlashItem[] = [...(ai ? aiSlashItems(ai) : []), ...defaultSlashItems, ...(slashItems ?? [])];
  return (
    <div className={`glass-editor ${className ?? ""}`} onKeyDown={(e) => { if (e.key === "/") setSlashOpen(true); if (e.key === "Escape") setSlashOpen(false); }}>
      <div className="glass-editor__bar">
        <button type="button" aria-label="Insert block" onClick={() => setSlashOpen((v) => !v)}>＋</button>
      </div>
      {editor && (
        <BubbleMenu editor={editor} className="glass-bubble">
          <button type="button" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
          <button type="button" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" aria-label="Link" onClick={() => { const url = window.prompt("Link URL"); if (url) editor.chain().focus().setLink({ href: url }).run(); }}>Link</button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
      {editor && <SlashMenu items={items} editor={editor} open={slashOpen} onClose={() => setSlashOpen(false)} />}
    </div>
  );
}
```

- [ ] **Step 4: `src/styles.css`** (structural hooks; hosts theme)

```css
.glass-editor { position: relative; }
.glass-editor__content:focus { outline: none; }
.glass-slash { position: absolute; z-index: 20; min-width: 12rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; background: #fff; padding: 0.25rem; box-shadow: 0 8px 24px rgba(0,0,0,.12); }
.glass-slash__label { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #6b7280; padding: 0.25rem 0.5rem; }
.glass-slash__item { display: block; width: 100%; text-align: left; padding: 0.375rem 0.5rem; border-radius: 0.375rem; background: none; border: 0; cursor: pointer; }
.glass-slash__item:hover { background: #f3f4f6; }
.glass-bubble { display: flex; gap: 0.25rem; background: #111; color: #fff; padding: 0.25rem; border-radius: 0.375rem; }
```

- [ ] **Step 5: Run → PASS** + typecheck; export `GlassEditor`, `GlassEditorProps` from `index.ts`.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: GlassEditor component (bubble + slash + injected AI)"`

---

### Task 7: Build smoke + README usage + tag

**Files:** Modify `README.md`; verify `dist/`.

- [ ] **Step 1: Build** — `pnpm build` → verify `dist/index.js` + `dist/index.d.ts` + `dist/styles.css` exist; `rg -c "import.*react" dist/index.js` shows react is **external** (not bundled).

- [ ] **Step 2: README usage** — append a usage block to `README.md`:

```markdown
## Usage

```tsx
import { GlassEditor, type AiAdapter } from "@nakshatra/glass-editor";
import "@nakshatra/glass-editor/styles.css";

const ai: AiAdapter = {
  continue: (text) => myBackend.continue(text),
  ask: (text, instruction) => myBackend.ask(text, instruction),
};

<GlassEditor value={doc} onChange={setDoc} ai={ai} />
```
```

- [ ] **Step 3: Commit + tag**

```bash
git add -A && git commit -m "docs: README usage; chore: verify lib build"
git tag v0.0.1
```

(Publishing to npm is deferred until consumers link locally and the API settles — out of scope for v1.)

---

## Self-Review
- **Spec coverage:** scaffold/peers/Vite-lib (Task 1, GE-D3) ✅; OSS extensions (Task 2, GE-D1) ✅;
  slash registry + types (Task 3) ✅; injected AI adapter + AI items (Task 4, GE-D2) ✅; slash UI
  (Task 5) ✅; `GlassEditor` controlled value/onChange + bubble + slash + injection (Task 6,
  GE-D4) ✅; structural CSS hooks (Task 6, GE-D5) ✅; build + usage (Task 7) ✅.
- **Placeholder scan:** none — runnable code/commands throughout; two conditional typing notes
  (Task 4 `run` widening; Task 1 add `@vitejs/plugin-react`) are explicit fixes.
- **Type consistency:** `SlashItem`/`AiAdapter`/`defaultExtensions`/`defaultSlashItems`/
  `aiSlashItems`/`GlassEditorProps` defined once and reused; `GlassEditor` composes them.
- **Deferred (v1):** caret-anchored `@tiptap/suggestion` slash popup (v1 uses a toggle + filterless
  menu); npm publish; image upload; markdown export. Consumers (incl. the CMS host) wire this in
  their own repos — out of scope here.
