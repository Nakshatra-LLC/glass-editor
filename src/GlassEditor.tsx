import { useEffect, useRef } from "react";
import { useEditor, EditorContent, BubbleMenu, type Content, type Extension, type JSONContent } from "@tiptap/react";
import { defaultExtensions } from "./extensions";
import type { SlashItem } from "./slash/items";
import type { AiAdapter } from "./ai/aiSlashItems";

export type GlassEditorProps = {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  /**
   * AI adapter that enables AI-powered slash-menu items. For stable behavior,
   * pass a stable/memoized reference (e.g. via `useMemo` or module-level constant);
   * a fresh object each render will not cause extra re-renders but is unnecessary.
   */
  ai?: AiAdapter;
  extensions?: Extension[];
  slashItems?: SlashItem[];
  placeholder?: string;
  className?: string;
  editable?: boolean;
};

export function GlassEditor({ value, onChange, ai, extensions, slashItems, placeholder, className, editable = true }: GlassEditorProps) {
  // Unused: ai and slashItems are reserved for future use (Task 9: wiring new SlashMenu)
  // Keep a ref to the latest onChange so onUpdate always calls the current handler
  // without recreating the editor when the prop changes (avoids stale-closure bug).
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  const editor = useEditor({
    editable,
    extensions: extensions ?? defaultExtensions({ placeholder }),
    content: value as Content,
    onUpdate: ({ editor }) => onChangeRef.current(editor.getJSON()),
    editorProps: { attributes: { class: "glass-editor__content" } },
  });
  // Sync external value changes into the editor after mount (controlled component).
  // Guard with JSON.stringify to skip redundant resets caused by the editor's own onUpdate → onChange → rerender cycle.
  useEffect(() => {
    if (editor && JSON.stringify(value) !== JSON.stringify(editor.getJSON())) {
      editor.commands.setContent(value as Content, false);
    }
  }, [editor, value]);

  // Slash menu wiring deferred to Task 9
  return (
    <div className={`glass-editor ${className ?? ""}`}>
      <div className="glass-editor__bar">
        <button type="button" aria-label="Insert block">＋</button>
      </div>
      {editor && (
        <BubbleMenu editor={editor} className="glass-bubble">
          <button type="button" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
          <button type="button" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" aria-label="Link" onClick={() => { const url = window.prompt("Link URL"); if (url) editor.chain().focus().setLink({ href: url }).run(); }}>Link</button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
