import type { Editor } from "@tiptap/react";

export type SlashItem = {
  id: string;
  label: string;
  group?: string;
  keywords?: string[];
  run: (editor: Editor) => void;
};

const c = (e: Editor) => e.chain().focus();

export const defaultSlashItems: SlashItem[] = [
  { id: "paragraph", label: "Text", group: "Blocks", run: (e) => c(e).setParagraph().run() },
  { id: "h1", label: "Heading 1", group: "Blocks", run: (e) => c(e).toggleHeading({ level: 1 }).run() },
  { id: "h2", label: "Heading 2", group: "Blocks", run: (e) => c(e).toggleHeading({ level: 2 }).run() },
  { id: "h3", label: "Heading 3", group: "Blocks", run: (e) => c(e).toggleHeading({ level: 3 }).run() },
  { id: "bulletList", label: "Bullet List", group: "Blocks", run: (e) => c(e).toggleBulletList().run() },
  { id: "orderedList", label: "Numbered List", group: "Blocks", run: (e) => c(e).toggleOrderedList().run() },
  { id: "taskList", label: "To-do List", group: "Blocks", run: (e) => c(e).toggleTaskList().run() },
  { id: "blockquote", label: "Quote", group: "Blocks", run: (e) => c(e).toggleBlockquote().run() },
  { id: "codeBlock", label: "Code", group: "Blocks", run: (e) => c(e).toggleCodeBlock().run() },
  { id: "divider", label: "Divider", group: "Blocks", run: (e) => c(e).setHorizontalRule().run() },
];
