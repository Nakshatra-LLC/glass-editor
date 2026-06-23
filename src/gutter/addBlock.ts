// src/gutter/addBlock.ts
import type { Editor } from "@tiptap/react";

/**
 * Insert a new empty paragraph after the top-level block containing `pos`
 * and move the selection into it. If that block is already an empty
 * paragraph, reuse it (no redundant block). Returns the cursor position.
 */
export function addBlockAfter(editor: Editor, pos: number): number {
  const { doc } = editor.state;
  const clamped = Math.min(Math.max(pos, 0), doc.content.size);
  const $pos = doc.resolve(clamped);

  // Guard: position not inside a top-level block — append at doc end.
  if ($pos.depth === 0) {
    const end = doc.content.size;
    editor.chain().focus().insertContentAt(end, { type: "paragraph" }).run();
    const inside = editor.state.selection.from;
    return inside;
  }

  const block = $pos.node(1);
  const isEmptyParagraph = block.type.name === "paragraph" && block.content.size === 0;

  if (isEmptyParagraph) {
    const inside = $pos.start(1);
    editor.chain().focus().setTextSelection(inside).run();
    return inside;
  }

  const after = $pos.after(1);
  editor
    .chain()
    .focus()
    .insertContentAt(after, { type: "paragraph" })
    .setTextSelection(after + 1)
    .run();
  return after + 1;
}
