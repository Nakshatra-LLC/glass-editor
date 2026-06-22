import type { Editor } from "@tiptap/react";

export function openSlashAt(editor: Editor): void {
  editor.chain().focus().insertContent("/").run();
}

export function Gutter({ editor }: { editor: Editor }) {
  return (
    <div className="glass-gutter" contentEditable={false}>
      <button
        type="button"
        aria-label="Insert block"
        className="glass-gutter__add"
        onMouseDown={(e) => { e.preventDefault(); openSlashAt(editor); }}
      >
        ＋
      </button>
      {/* Reserved drag-handle slot — inert in v1 (drag is deferred, needs a custom OSS impl). */}
      <span className="glass-gutter__drag" aria-hidden="true" />
    </div>
  );
}
