import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import type { Extension } from "@tiptap/core";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { createSlashCommand } from "./slash/SlashCommand";
import { filterSlashItems, type SlashItem } from "./slash/items";

export function defaultExtensions(opts?: {
  placeholder?: string;
  slash?: { items: () => SlashItem[]; render: SuggestionOptions<SlashItem>["render"] };
}): Extension[] {
  const base = [
    StarterKit,
    Link.configure({ openOnClick: false }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Image,
    Placeholder.configure({ placeholder: opts?.placeholder ?? "Write something, or press / for blocks…" }),
  ] as unknown as Extension[];
  if (opts?.slash) {
    base.push(createSlashCommand({
      items: (query) => filterSlashItems(opts.slash!.items(), query),
      render: opts.slash.render,
    }));
  }
  return base;
}
