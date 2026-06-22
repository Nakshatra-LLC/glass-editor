import type { Editor } from "@tiptap/react";

export function openSlashAt(editor: Editor): void {
  editor.chain().focus().insertContent("/").run();
}

export function Gutter({ editor, top }: { editor: Editor; top?: number | null }) {
  return (
    <div className="clean-gutter" contentEditable={false} style={top == null ? undefined : { top }}>
      <button
        type="button"
        aria-label="Insert block"
        className="clean-gutter__add"
        onMouseDown={(e) => { e.preventDefault(); openSlashAt(editor); }}
      >
        ＋
      </button>
      {/* Reserved drag-handle slot — inert in v1 (drag is deferred, needs a custom OSS impl). */}
      <span className="clean-gutter__drag" aria-hidden="true" />
    </div>
  );
}
