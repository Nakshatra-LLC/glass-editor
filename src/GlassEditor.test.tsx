import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { GlassEditor } from "./GlassEditor";

test("renders the doc content", async () => {
  render(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Hello" }] }] }} onChange={() => {}} />);
  expect(await screen.findByText("Hello")).toBeInTheDocument();
});

test("AI slash items appear only when an adapter is provided", async () => {
  const ai = { continue: vi.fn(), ask: vi.fn() };
  const { rerender } = render(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph" }] }} onChange={() => {}} />);
  // open the menu via the exposed control (a "/" button for testability)
  (await screen.findByRole("button", { name: /insert block/i })).click();
  expect(screen.queryByRole("button", { name: /continue writing/i })).toBeNull();
  rerender(<GlassEditor value={{ type: "doc", content: [{ type: "paragraph" }] }} onChange={() => {}} ai={ai} />);
  (await screen.findByRole("button", { name: /insert block/i })).click();
  expect(await screen.findByRole("button", { name: /continue writing/i })).toBeInTheDocument();
});
