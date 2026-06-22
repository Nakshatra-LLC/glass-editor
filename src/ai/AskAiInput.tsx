import { useState } from "react";
import type { Editor } from "@tiptap/react";
import type { AiAdapter } from "./aiSlashItems";

export function AskAiInput({ editor, ai, onClose }: { editor: Editor; ai: AiAdapter; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async () => {
    const instruction = value.trim();
    if (!instruction) { onClose(); return; }
    setPending(true);
    try {
      const result = await ai.ask(editor.getText(), instruction);
      editor.commands.insertContent(result);
      onClose();
    } catch (err) {
      console.error("glass-editor: AI request failed", err);
      setPending(false);
    }
  };
  return (
    <div className="glass-askai">
      <input
        autoFocus
        aria-label="Ask AI what you want"
        className="glass-askai__input"
        placeholder="Ask AI what you want…"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); void submit(); }
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
        }}
      />
    </div>
  );
}
