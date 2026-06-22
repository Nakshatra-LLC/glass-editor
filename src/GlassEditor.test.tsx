import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { GlassEditor } from "./GlassEditor";

vi.mock("@tiptap/react", async (orig) => {
  const actual = await orig<typeof import("@tiptap/react")>();
  return { ...actual, BubbleMenu: ({ children }: any) => <div>{children}</div> };
});

const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] };

test("renders the doc content", async () => {
  render(<GlassEditor value={doc} onChange={() => {}} />);
  expect(await screen.findByText("Hello")).toBeInTheDocument();
});

test("mounts the editor container without throwing", async () => {
  let captured: any;
  render(<GlassEditor value={doc} onChange={() => {}} />);
  // The extension is present in the default set; assert via the editor's schema-independent marker:
  captured = document.querySelector(".glass-editor");
  expect(captured).toBeInTheDocument();
});

test("renders injected bubble items", async () => {
  render(
    <GlassEditor
      value={doc}
      onChange={() => {}}
      bubbleItems={[{ id: "ask", label: "Ask AI", run: () => {} }]}
    />,
  );
  expect(await screen.findByRole("button", { name: "Ask AI" })).toBeInTheDocument();
});

test("renders root with data-theme when theme prop is set", async () => {
  const { container } = render(<GlassEditor value={doc} onChange={() => {}} theme="dark" />);
  const root = container.querySelector(".glass-editor");
  expect(root?.getAttribute("data-theme")).toBe("dark");
});

test("renders root without data-theme when theme prop is omitted", async () => {
  const { container } = render(<GlassEditor value={doc} onChange={() => {}} />);
  const root = container.querySelector(".glass-editor");
  expect(root?.getAttribute("data-theme")).toBeNull();
});
