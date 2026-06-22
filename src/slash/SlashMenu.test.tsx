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
