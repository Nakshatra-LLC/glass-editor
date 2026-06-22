import { useState } from "react";
import type { Editor } from "@tiptap/react";

export function LinkInput({ editor, onClose }: { editor: Editor; onClose: () => void }) {
  const [url, setUrl] = useState<string>(editor.getAttributes("link").href ?? "");
  const apply = () => {
    const href = url.trim();
    if (href) editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    onClose();
  };
  const remove = () => { editor.chain().focus().extendMarkRange("link").unsetLink().run(); onClose(); };
  return (
    <div className="clean-bubble__link">
      <input
        autoFocus
        aria-label="Link URL"
        className="clean-bubble__input"
        value={url}
        placeholder="https://…"
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); apply(); }
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
        }}
      />
      <button type="button" className="clean-bubble__btn" onMouseDown={(e) => { e.preventDefault(); apply(); }}>Apply</button>
      {editor.isActive("link") && (
        <button type="button" className="clean-bubble__btn" onMouseDown={(e) => { e.preventDefault(); remove(); }}>Unlink</button>
      )}
    </div>
  );
}
