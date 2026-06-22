import { useState, useEffect } from "react";
import { useEditor, EditorContent, BubbleMenu, type Content, type Extension, type JSONContent } from "@tiptap/react";
import { defaultExtensions } from "./extensions";
import { defaultSlashItems, type SlashItem } from "./slash/items";
import { aiSlashItems, type AiAdapter } from "./ai/aiSlashItems";
import { SlashMenu } from "./slash/SlashMenu";

export type GlassEditorProps = {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  ai?: AiAdapter;
  extensions?: Extension[];
  slashItems?: SlashItem[];
  placeholder?: string;
  className?: string;
  editable?: boolean;
};

export function GlassEditor({ value, onChange, ai, extensions, slashItems, placeholder, className, editable = true }: GlassEditorProps) {
  const [slashOpen, setSlashOpen] = useState(false);
  // Reset the slash menu when the AI adapter changes so the menu reflects the new item set.
  useEffect(() => { setSlashOpen(false); }, [ai]);
  const editor = useEditor({
    editable,
    extensions: extensions ?? defaultExtensions({ placeholder }),
    content: value as Content,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: { attributes: { class: "glass-editor__content" } },
  });
  const items: SlashItem[] = [...(ai ? aiSlashItems(ai) : []), ...defaultSlashItems, ...(slashItems ?? [])];
  return (
    <div className={`glass-editor ${className ?? ""}`} onKeyDown={(e) => { if (e.key === "/") setSlashOpen(true); if (e.key === "Escape") setSlashOpen(false); }}>
      <div className="glass-editor__bar">
        <button type="button" aria-label="Insert block" onClick={() => setSlashOpen((v) => !v)}>＋</button>
      </div>
      {editor && (
        <BubbleMenu editor={editor} className="glass-bubble">
          <button type="button" aria-label="Bold" onClick={() => editor.chain().focus().toggleBold().run()}>B</button>
          <button type="button" aria-label="Italic" onClick={() => editor.chain().focus().toggleItalic().run()}>I</button>
          <button type="button" aria-label="Link" onClick={() => { const url = window.prompt("Link URL"); if (url) editor.chain().focus().setLink({ href: url }).run(); }}>Link</button>
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
      {editor && <SlashMenu items={items} editor={editor} open={slashOpen} onClose={() => setSlashOpen(false)} />}
    </div>
  );
}
