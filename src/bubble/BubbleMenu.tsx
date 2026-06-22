import { useState } from "react";
import { BubbleMenu, type Editor } from "@tiptap/react";
import type { BubbleItem } from "./items";
import { LinkInput } from "./LinkInput";

export function CleanBubbleMenu({ editor, items }: { editor: Editor; items: BubbleItem[] }) {
  const [linkOpen, setLinkOpen] = useState(false);
  return (
    <BubbleMenu editor={editor} className="clean-bubble">
      {linkOpen ? (
        <LinkInput editor={editor} onClose={() => setLinkOpen(false)} />
      ) : (
        items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            className={`clean-bubble__btn${item.isActive?.(editor) ? " is-active" : ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              if (item.id === "link") setLinkOpen(true);
              else void item.run(editor);
            }}
          >
            {item.icon ?? (item.id === "bold" ? <b>B</b> : item.id === "italic" ? <i>I</i> : item.label)}
          </button>
        ))
      )}
    </BubbleMenu>
  );
}
