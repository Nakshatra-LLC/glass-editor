import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { GlassEditor } from "./GlassEditor";
import type { JSONContent } from "@tiptap/react";

// TipTap's BubbleMenu calls tippy() during editor state updates; jsdom has no
// real layout engine so tippy throws. We stub out BubbleMenu entirely for testing.
vi.mock("@tiptap/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tiptap/react")>();
  return { ...actual, BubbleMenu: () => null };
});

test("renders the doc content", async () => {
  render(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] }} onChange={() => {}} />);
  expect(await screen.findByText("Hello")).toBeInTheDocument();
});

test("external value changes propagate into the editor after mount", async () => {
  const initialDoc: JSONContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Initial" }] }] };
  const updatedDoc: JSONContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Updated" }] }] };
  const { rerender } = render(<GlassEditor value={initialDoc} onChange={() => {}} />);
  expect(await screen.findByText("Initial")).toBeInTheDocument();
  rerender(<GlassEditor value={updatedDoc} onChange={() => {}} />);
  expect(await screen.findByText("Updated")).toBeInTheDocument();
  expect(screen.queryByText("Initial")).toBeNull();
});

test("calls the latest onChange handler, not a stale closure from mount time", async () => {
  // jsdom's ProseMirror integration lacks elementFromPoint/getClientRects, so userEvent.type
  // via mouse events is unreliable. Instead we dispatch a synthetic "input" event directly on
  // the contenteditable to drive ProseMirror's DOMObserver → readDOMChange → onUpdate path,
  // which is the same code path triggered by real typing.
  const doc: JSONContent = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] };
  const onChangeA = vi.fn();
  const onChangeB = vi.fn();

  const { rerender } = render(<GlassEditor value={doc} onChange={onChangeA} />);
  // Wait for editor to mount
  await screen.findByText("Hello");

  // Swap to a different onChange handler
  rerender(<GlassEditor value={doc} onChange={onChangeB} />);

  // Mutate the DOM directly then fire an "input" event so ProseMirror's DOMObserver picks up
  // the change and calls dispatchTransaction → onUpdate → onChange.
  const contentEditable = document.querySelector(".glass-editor__content") as HTMLElement;
  const paragraph = contentEditable.querySelector("p") as HTMLElement;
  paragraph.textContent = "HelloX";
  paragraph.dispatchEvent(new Event("input", { bubbles: true }));

  // Give React / ProseMirror one async tick to process
  await new Promise((r) => setTimeout(r, 50));

  // The LATEST handler (b) must have been called; the stale one (a) must NOT have been called after rerender
  expect(onChangeB).toHaveBeenCalled();
  expect(onChangeA).not.toHaveBeenCalled();
});

// TODO: Task 9 wires the new SlashMenu with keyboard reducer; this test will be restored then
// test("AI slash items appear only when an adapter is provided", async () => {
//   const ai = { continue: vi.fn(), ask: vi.fn() };
//   const { rerender } = render(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph" }] }} onChange={() => {}} />);
//   // open the menu via the exposed control (a "/" button for testability)
//   (await screen.findByRole("button", { name: /insert block/i })).click();
//   expect(screen.queryByRole("button", { name: /continue writing/i })).toBeNull();
//   rerender(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph" }] }} onChange={() => {}} ai={ai} />);
//   (await screen.findByRole("button", { name: /insert block/i })).click();
//   expect(await screen.findByRole("button", { name: /continue writing/i })).toBeInTheDocument();
// });
