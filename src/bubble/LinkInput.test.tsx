import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { LinkInput } from "./LinkInput";

function fakeEditor(linkActive = false) {
  const setLink = vi.fn().mockReturnThis();
  const unsetLink = vi.fn().mockReturnThis();
  const chain: any = { focus: () => chain, extendMarkRange: () => chain, setLink, unsetLink, run: vi.fn() };
  return { calls: { setLink, unsetLink }, chain: () => chain, getAttributes: () => ({ href: "" }), isActive: () => linkActive } as any;
}

test("applies a link on submit", async () => {
  const editor = fakeEditor();
  const onClose = vi.fn();
  render(<LinkInput editor={editor} onClose={onClose} />);
  await userEvent.type(screen.getByRole("textbox", { name: /link url/i }), "https://example.com");
  await userEvent.keyboard("{Enter}");
  expect(editor.calls.setLink).toHaveBeenCalledWith({ href: "https://example.com" });
  expect(onClose).toHaveBeenCalled();
});

test("cancels on Escape without setting a link", async () => {
  const editor = fakeEditor();
  const onClose = vi.fn();
  render(<LinkInput editor={editor} onClose={onClose} />);
  await userEvent.type(screen.getByRole("textbox", { name: /link url/i }), "x");
  await userEvent.keyboard("{Escape}");
  expect(editor.calls.setLink).not.toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

test("shows Unlink button when a link is active", async () => {
  const editor = fakeEditor(true);
  const onClose = vi.fn();
  render(<LinkInput editor={editor} onClose={onClose} />);
  expect(screen.queryByRole("button", { name: /unlink/i })).not.toBeNull();
});

test("hides Unlink button when no link is active", async () => {
  const editor = fakeEditor(false);
  const onClose = vi.fn();
  render(<LinkInput editor={editor} onClose={onClose} />);
  expect(screen.queryByRole("button", { name: /unlink/i })).toBeNull();
});

test("clicking Unlink calls unsetLink and closes", async () => {
  const editor = fakeEditor(true);
  const onClose = vi.fn();
  render(<LinkInput editor={editor} onClose={onClose} />);
  await userEvent.pointer({ target: screen.getByRole("button", { name: /unlink/i }), keys: "[MouseLeft>]" });
  expect(editor.calls.unsetLink).toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});
