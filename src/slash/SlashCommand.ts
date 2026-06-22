import { Extension, type Editor, type Range } from "@tiptap/core";
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion";
import type { SlashItem } from "./items";

export function executeSlashItem(
  editor: Editor,
  range: { from: number; to: number },
  item: SlashItem,
): void {
  editor.chain().focus().deleteRange(range as Range).run();
  void item.run(editor);
}

export type SlashCommandOptions = {
  items: (query: string) => SlashItem[];
  render: SuggestionOptions<SlashItem>["render"];
};

export function createSlashCommand(opts: SlashCommandOptions): Extension {
  return Extension.create<SlashCommandOptions>({
    name: "slashCommand",
    addOptions() {
      return { items: () => [], render: () => ({}) };
    },
    addProseMirrorPlugins() {
      return [
        Suggestion<SlashItem>({
          editor: this.editor,
          char: "/",
          startOfLine: false,
          items: ({ query }) => opts.items(query),
          command: ({ editor, range, props }) => executeSlashItem(editor, range, props),
          render: opts.render,
        }),
      ];
    },
  }).configure(opts);
}
