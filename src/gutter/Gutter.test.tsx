import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { expect, test, vi } from "vitest";
import { GutterContent, Gutter } from "./Gutter";

// DragHandle uses tippy.js + ProseMirror plugin views that reparent DOM nodes,
// which is incompatible with jsdom (same class of issue as BubbleMenu in CleanEditor tests).
// Stub it to a capturing passthrough wrapper so:
//   a) the GutterContent markup remains testable, and
//   b) the onNodeChange callback passed by Gutter can be captured and exercised.
const hoisted = vi.hoisted(() => ({
  onNodeChange: undefined as undefined | ((a: any) => void),
  tippyOptions: undefined as undefined | unknown,
}));
vi.mock("@tiptap/extension-drag-handle-react", () => ({
  DragHandle: ({ children, onNodeChange, tippyOptions }: any) => {
    hoisted.onNodeChange = onNodeChange;
    hoisted.tippyOptions = tippyOptions;
    return <>{children}</>;
  },
}));

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

test("Gutter renders GutterContent under a stubbed DragHandle without throwing", () => {
  const element = document.createElement("div");
  const editor = new Editor({ element, extensions: [StarterKit], content: "<p>hi</p>" });
  const { unmount } = render(<Gutter editor={editor} onAdd={() => {}} />);
  unmount();
  editor.destroy();
});

test("Gutter: passes referentially STABLE onNodeChange and tippyOptions across re-renders", async () => {
  // Regression guard. The DragHandle's plugin-registration effect depends on
  // [element, editor, onNodeChange, pluginKey, tippyOptions]. If onNodeChange or
  // tippyOptions change identity on render, the effect re-runs → unregister +
  // re-register the ProseMirror plugin → editor.view.updateState() tears down ALL
  // plugin views (including the slash/suggestion popup, firing its onExit mid-open).
  // The controlled component re-renders on every keystroke, so unstable props here
  // break the slash menu and the add-block menu. Both MUST be memoized.
  const element = document.createElement("div");
  const editor = new Editor({ element, extensions: [StarterKit], content: "<p>hi</p>" });

  // rerender() flushes under act(); a fresh onAdd prop each time mirrors the parent
  // re-rendering on every keystroke. The editor reference stays the same.
  const { rerender, unmount } = render(<Gutter editor={editor} onAdd={() => {}} />);
  const firstOnNodeChange = hoisted.onNodeChange;
  const firstTippyOptions = hoisted.tippyOptions;

  rerender(<Gutter editor={editor} onAdd={() => {}} />);

  expect(hoisted.onNodeChange).toBe(firstOnNodeChange);
  expect(hoisted.tippyOptions).toBe(firstTippyOptions);

  unmount();
  editor.destroy();
});

test("Gutter: onNodeChange updates posRef so + button calls onAdd with captured pos", async () => {
  const element = document.createElement("div");
  const editor = new Editor({ element, extensions: [StarterKit], content: "<p>hi</p>" });
  const onAdd = vi.fn();
  const { unmount } = render(<Gutter editor={editor} onAdd={onAdd} />);

  // Invoke the onNodeChange callback that Gutter passed to the stubbed DragHandle
  hoisted.onNodeChange?.({ pos: 42, node: null, editor });

  // Click the + button — it should call onAdd with the captured pos (42), not the fallback
  await userEvent.click(screen.getByRole("button", { name: /add block/i }));
  expect(onAdd).toHaveBeenCalledWith(42);

  unmount();
  editor.destroy();
});
