import { useCallback, useRef } from "react";
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
  // onNodeChange MUST be referentially stable. <DragHandle>'s plugin-registration
  // effect depends on [element, editor, onNodeChange, pluginKey, tippyOptions]; if
  // any changes identity on render it unregisters + re-registers the ProseMirror
  // plugin, whose editor.view.updateState() tears down ALL plugin views — including
  // the slash/suggestion popup (firing its onExit mid-open). The controlled component
  // re-renders on every keystroke, so an inline callback would destroy the slash &
  // add-block menus as they open. We pass NO tippyOptions: the extension's default
  // placement ('left-start', anchored to the hovered node's rect) positions the handle
  // correctly. If you ever add tippyOptions, memoize it for the same reason.
  const onNodeChange = useCallback(
    ({ pos }: { node: import("@tiptap/pm/model").Node | null; editor: Editor; pos: number }) => {
      posRef.current = pos;
    },
    [],
  );
  return (
    <DragHandle editor={editor} onNodeChange={onNodeChange}>
      <GutterContent onAdd={() => onAdd(posRef.current ?? editor.state.selection.from)} />
    </DragHandle>
  );
}
