import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { AskAiInput } from "./AskAiInput";

function fakeEditor() {
  const inserted: string[] = [];
  return { getText: () => "Seed.", commands: { insertContent: (t: string) => inserted.push(t) }, inserted } as any;
}

test("submits instruction on Enter, calls onSubmit, inserts result", async () => {
  const onSubmit = vi.fn().mockResolvedValue(" Done.");
  const editor = fakeEditor();
  const onClose = vi.fn();
  render(
    <AskAiInput
      editor={editor}
      placeholder="Ask AI what you want…"
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
  await userEvent.type(screen.getByRole("textbox"), "make it formal");
  await userEvent.keyboard("{Enter}");
  expect(onSubmit).toHaveBeenCalledWith("make it formal");
  expect(editor.inserted).toContain(" Done.");
  expect(onClose).toHaveBeenCalled();
});

test("clicking sparkle submit button also submits", async () => {
  const onSubmit = vi.fn().mockResolvedValue(" Clicked.");
  const editor = fakeEditor();
  const onClose = vi.fn();
  render(
    <AskAiInput
      editor={editor}
      placeholder="Ask AI what you want…"
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
  await userEvent.type(screen.getByRole("textbox"), "expand this");
  await userEvent.click(screen.getByRole("button", { name: /submit/i }));
  expect(onSubmit).toHaveBeenCalledWith("expand this");
  expect(editor.inserted).toContain(" Clicked.");
  expect(onClose).toHaveBeenCalled();
});

test("a rejecting onSubmit does not throw and inserts nothing", async () => {
  const onSubmit = vi.fn().mockRejectedValue(new Error("boom"));
  const editor = fakeEditor();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <AskAiInput
      editor={editor}
      placeholder="Ask AI what you want…"
      onSubmit={onSubmit}
      onClose={() => {}}
    />
  );
  await userEvent.type(screen.getByRole("textbox"), "x");
  await userEvent.keyboard("{Enter}");
  expect(editor.inserted).toHaveLength(0);
  expect(errorSpy).toHaveBeenCalledWith("clean-editor: AI request failed", expect.any(Error));
  errorSpy.mockRestore();
});

test("Escape calls onClose without submitting", async () => {
  const onSubmit = vi.fn();
  const onClose = vi.fn();
  const editor = fakeEditor();
  render(
    <AskAiInput
      editor={editor}
      placeholder="Ask AI what you want…"
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
  await userEvent.type(screen.getByRole("textbox"), "some text");
  await userEvent.keyboard("{Escape}");
  expect(onClose).toHaveBeenCalled();
  expect(onSubmit).not.toHaveBeenCalled();
});
