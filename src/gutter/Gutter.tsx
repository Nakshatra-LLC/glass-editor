import { useMemo, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { DragHandle } from "@tiptap/extension-drag-handle-react";
import { IconPlus, IconGrip } from "./icons";

export function GutterContent({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="clean-gutter">
      <button
        type="button"
        aria-label="Add block"
        className="clean-gutter__add"
        onClick={onAdd}
      >
        <IconPlus />
      </button>
      <span className="clean-gutter__drag" aria-label="Drag to reorder" role="img">
        <IconGrip />
      </span>
    </div>
  );
}

export function Gutter({ editor, onAdd }: { editor: Editor; onAdd: (pos: number) => void }) {
  const posRef = useRef<number | null>(null);
  // Tippy options MUST be memoized (else the handle re-inits every render).
  const tippyOptions = useMemo(() => ({ offset: [-4, 8] as [number, number] }), []);
  return (
    <DragHandle
      editor={editor}
      tippyOptions={tippyOptions}
      onNodeChange={({ pos }: { node: import("@tiptap/pm/model").Node | null; editor: Editor; pos: number }) => {
        posRef.current = pos;
      }}
    >
      <GutterContent onAdd={() => onAdd(posRef.current ?? editor.state.selection.from)} />
    </DragHandle>
  );
}
