import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { Gutter, openSlashAt } from "./Gutter";

function fakeEditor() {
  const inserted: string[] = [];
  const chain: any = { focus: () => chain, insertContent: (t: string) => { inserted.push(t); return chain; }, run: vi.fn() };
  return { inserted, chain: () => chain } as any;
}

test("openSlashAt inserts a slash to trigger the popup", () => {
  const editor = fakeEditor();
  openSlashAt(editor);
  expect(editor.inserted).toContain("/");
});

test("clicking the gutter + opens the slash menu", async () => {
  const editor = fakeEditor();
  render(<Gutter editor={editor} />);
  await userEvent.click(screen.getByRole("button", { name: /insert block/i }));
  expect(editor.inserted).toContain("/");
});
