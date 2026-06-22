import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { executeSlashItem } from "./SlashCommand";
import type { SlashItem } from "./items";

function makeEditor(text: string) {
  const element = document.createElement("div");
  return new Editor({ element, extensions: [StarterKit], content: `<p>${text}</p>` });
}

test("executeSlashItem deletes the slash range and runs the item", () => {
  const editor = makeEditor("/he");
  // doc: <p>/he</p> → positions 1.."/he".length+1
  const from = 1;
  const to = 1 + "/he".length;
  const item: SlashItem = {
    id: "h1", label: "Heading 1",
    run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  };
  executeSlashItem(editor, { from, to }, item);
  const json = editor.getJSON();
  expect(json.content?.[0].type).toBe("heading");
  // the "/he" text was removed
  expect(JSON.stringify(json)).not.toContain("/he");
  editor.destroy();
});
