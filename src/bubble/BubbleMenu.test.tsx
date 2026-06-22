import { render, screen } from "@testing-library/react";
import { vi, expect, test } from "vitest";
import { GlassBubbleMenu } from "./BubbleMenu";
import { defaultBubbleItems, type BubbleItem } from "./items";

// Render the bubble's content directly (bypass @tiptap/react BubbleMenu positioning).
vi.mock("@tiptap/react", async (orig) => {
  const actual = await orig<typeof import("@tiptap/react")>();
  return { ...actual, BubbleMenu: ({ children }: any) => <div>{children}</div> };
});

function fakeEditor() {
  const chain: any = new Proxy({}, { get: () => (..._a: unknown[]) => chain });
  return { chain: () => chain, isActive: () => false, getAttributes: () => ({}) } as any;
}

test("renders default and injected bubble items", () => {
  const extra: BubbleItem = { id: "ask", label: "Ask AI", run: () => {} };
  render(<GlassBubbleMenu editor={fakeEditor()} items={[...defaultBubbleItems, extra]} />);
  expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Link" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Ask AI" })).toBeInTheDocument();
});
