import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { AskAiInput } from "./AskAiInput";

function fakeEditor() {
  const inserted: string[] = [];
  return { getText: () => "Seed.", commands: { insertContent: (t: string) => inserted.push(t) }, inserted } as any;
}

test("submits the instruction to ai.ask and inserts the result", async () => {
  const ai = { continue: vi.fn(), ask: vi.fn().mockResolvedValue(" Done.") };
  const editor = fakeEditor();
  const onClose = vi.fn();
  render(<AskAiInput editor={editor} ai={ai} onClose={onClose} />);
  await userEvent.type(screen.getByRole("textbox", { name: /ask ai/i }), "make it formal");
  await userEvent.keyboard("{Enter}");
  expect(ai.ask).toHaveBeenCalledWith("Seed.", "make it formal");
  expect(editor.inserted).toContain(" Done.");
});

test("a rejecting adapter does not throw and inserts nothing", async () => {
  const ai = { continue: vi.fn(), ask: vi.fn().mockRejectedValue(new Error("boom")) };
  const editor = fakeEditor();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(<AskAiInput editor={editor} ai={ai} onClose={() => {}} />);
  await userEvent.type(screen.getByRole("textbox", { name: /ask ai/i }), "x");
  await userEvent.keyboard("{Enter}");
  expect(editor.inserted).toHaveLength(0);
  expect(errorSpy).toHaveBeenCalled();
  errorSpy.mockRestore();
});
