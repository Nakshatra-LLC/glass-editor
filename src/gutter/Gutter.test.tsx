import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { expect, test, vi } from "vitest";
import { GutterContent, Gutter } from "./Gutter";

// DragHandle uses tippy.js + ProseMirror plugin views that reparent DOM nodes,
// which is incompatible with jsdom (same class of issue as BubbleMenu in CleanEditor tests).
// Stub it to a passthrough wrapper so the GutterContent markup remains testable.
vi.mock("@tiptap/extension-drag-handle-react", () => ({
  DragHandle: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

test("Gutter mounts with a real editor without throwing", () => {
  const element = document.createElement("div");
  const editor = new Editor({ element, extensions: [StarterKit], content: "<p>hi</p>" });
  const { unmount } = render(<Gutter editor={editor} onAdd={() => {}} />);
  unmount();
  editor.destroy();
});
