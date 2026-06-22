import type { Editor } from "@tiptap/react";
import type { ReactNode } from "react";

export type BubbleItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  isActive?: (editor: Editor) => boolean;
  run: (editor: Editor) => void | Promise<void>;
};

// `link` is handled specially by CleanBubbleMenu (opens the inline LinkInput).
export const defaultBubbleItems: BubbleItem[] = [
  { id: "bold", label: "Bold", isActive: (e) => e.isActive("bold"), run: (e) => { e.chain().focus().toggleBold().run(); } },
  { id: "italic", label: "Italic", isActive: (e) => e.isActive("italic"), run: (e) => { e.chain().focus().toggleItalic().run(); } },
  { id: "link", label: "Link", isActive: (e) => e.isActive("link"), run: () => {} },
];
