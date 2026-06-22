import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { IconSparkle } from "../slash/icons";

export function AskAiInput({
  editor,
  placeholder,
  onSubmit,
  onClose,
}: {
  editor: Editor;
  placeholder: string;
  onSubmit: (instruction: string) => Promise<string>;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const submit = async () => {
    const instruction = value.trim();
    if (!instruction) { onClose(); return; }
    setPending(true);
    try {
      const result = await onSubmit(instruction);
      editor.commands.insertContent(result);
      onClose();
    } catch (err) {
      console.error("clean-editor: AI request failed", err);
      setPending(false);
    }
  };
  return (
    <div className="clean-askai">
      <input
        autoFocus
        aria-label={placeholder}
        className="clean-askai__input"
        placeholder={placeholder}
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); void submit(); }
          if (e.key === "Escape") { e.preventDefault(); onClose(); }
        }}
      />
      <button
        aria-label="Submit"
        className="clean-askai__submit"
        disabled={pending}
        onMouseDown={(e) => { e.preventDefault(); void submit(); }}
      >
        <IconSparkle />
      </button>
    </div>
  );
}
