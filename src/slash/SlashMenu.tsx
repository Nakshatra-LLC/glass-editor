import type { Editor } from "@tiptap/react";
import type { SlashItem } from "./items";

export function SlashMenu({ items, editor, open, onClose }: { items: SlashItem[]; editor: Editor; open: boolean; onClose: () => void }) {
  if (!open) return null;
  const groups = Array.from(new Set(items.map((i) => i.group ?? "Blocks")));
  return (
    <div role="menu" className="glass-slash">
      {groups.map((g) => (
        <div key={g} className="glass-slash__group">
          <div className="glass-slash__label">{g}</div>
          {items.filter((i) => (i.group ?? "Blocks") === g).map((i) => (
            <button key={i.id} type="button" className="glass-slash__item" onClick={() => { i.run(editor); onClose(); }}>{i.label}</button>
          ))}
        </div>
      ))}
    </div>
  );
}
