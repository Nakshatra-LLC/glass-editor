// src/gutter/AddBlockMenu.test.tsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { beforeEach, expect, test, vi } from "vitest";
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

beforeEach(() => vi.clearAllMocks());

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

test("clicking outside the menu closes it without running an item", () => {
  const editor = makeEditor();
  const onClose = vi.fn();
  render(
    <div>
      <AddBlockMenu editor={editor} items={items} onClose={onClose} />
      <button>outside</button>
    </div>,
  );
  fireEvent.mouseDown(screen.getByText("outside"));
  expect(onClose).toHaveBeenCalledTimes(1);
  expect(items[0].run).not.toHaveBeenCalled();
  editor.destroy();
});

test("mousedown inside the menu does not trigger the outside-click close", () => {
  const editor = makeEditor();
  const onClose = vi.fn();
  render(<AddBlockMenu editor={editor} items={items} onClose={onClose} />);
  // A non-selecting region inside the popup (the group label) must not dismiss it.
  fireEvent.mouseDown(screen.getByText("Style"));
  expect(onClose).not.toHaveBeenCalled();
  editor.destroy();
});
