// src/gutter/addBlock.test.ts
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { expect, test } from "vitest";
import { addBlockAfter } from "./addBlock";

function makeEditor(html: string) {
  const element = document.createElement("div");
  return new Editor({ element, extensions: [StarterKit], content: html });
}

test("inserts an empty paragraph after a non-empty block and selects inside it", () => {
  const editor = makeEditor("<p>hello</p>");
  // pos 2 is inside "hello"
  const cursor = addBlockAfter(editor, 2);
  const json = editor.getJSON();
  expect(json.content).toHaveLength(2);
  expect(json.content?.[0]).toMatchObject({ type: "paragraph" });
  expect(json.content?.[1]).toMatchObject({ type: "paragraph" });
  // second paragraph is empty
  expect(json.content?.[1].content).toBeUndefined();
  // selection is collapsed inside the new (second) paragraph
  expect(editor.state.selection.empty).toBe(true);
  expect(editor.state.selection.from).toBe(cursor);
  // cursor sits in the new block, after the first paragraph "hello" (1 + 5 + 1 open = 8)
  expect(cursor).toBe(8);
  editor.destroy();
});

test("reuses an already-empty paragraph instead of inserting a redundant one", () => {
  const editor = makeEditor("<p></p>");
  const cursor = addBlockAfter(editor, 1);
  const json = editor.getJSON();
  expect(json.content).toHaveLength(1);
  expect(editor.state.selection.empty).toBe(true);
  expect(cursor).toBe(1);
  editor.destroy();
});
