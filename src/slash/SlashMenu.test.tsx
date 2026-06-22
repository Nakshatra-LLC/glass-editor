import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test } from "vitest";
import { SlashMenu, reduceSlashKey } from "./SlashMenu";
import type { SlashItem } from "./items";

test("reduceSlashKey moves, wraps, selects, and closes", () => {
  expect(reduceSlashKey("ArrowDown", { index: 0, count: 3 })).toMatchObject({ index: 1, handled: true });
  expect(reduceSlashKey("ArrowDown", { index: 2, count: 3 })).toMatchObject({ index: 0, handled: true });
  expect(reduceSlashKey("ArrowUp", { index: 0, count: 3 })).toMatchObject({ index: 2, handled: true });
  expect(reduceSlashKey("Enter", { index: 1, count: 3 })).toMatchObject({ select: true, handled: true });
  expect(reduceSlashKey("Escape", { index: 1, count: 3 })).toMatchObject({ close: true, handled: true });
  expect(reduceSlashKey("a", { index: 1, count: 3 })).toMatchObject({ handled: false });
});

test("SlashMenu renders grouped items and selects on click", async () => {
  const onSelect = vi.fn();
  const items: SlashItem[] = [
    { id: "h1", label: "Heading 1", group: "Style", run: () => {} },
    { id: "ai-continue", label: "Continue Writing", group: "AI", run: () => {} },
  ];
  render(<SlashMenu items={items} selectedIndex={0} onSelect={onSelect} />);
  expect(screen.getByText("AI")).toBeInTheDocument();
  expect(screen.getByText("Style")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("menuitem", { name: /heading 1/i }));
  expect(onSelect).toHaveBeenCalledWith(items[0]);
});

test("SlashMenu shows an empty state when there are no items", () => {
  render(<SlashMenu items={[]} selectedIndex={0} onSelect={() => {}} />);
  expect(screen.getByText(/no results/i)).toBeInTheDocument();
});
