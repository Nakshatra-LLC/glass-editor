import type { Editor } from "@tiptap/react";
import type { SlashItem } from "../slash/items";
import { IconSparkle } from "../slash/icons";

export type AiAdapter = {
  continue: (context: string) => Promise<string>;
  ask: (context: string, instruction: string) => Promise<string>;
};

export function aiSlashItems(ai: AiAdapter, hooks?: { onAsk?: () => void }): SlashItem[] {
  return [
    {
      id: "ai-continue", label: "Continue Writing", group: "AI", icon: <IconSparkle />,
      run: async (e: Editor) => {
        try { e.commands.insertContent(await ai.continue(e.getText())); }
        catch (err) { console.error("glass-editor: AI request failed", err); }
      },
    },
    {
      id: "ai-ask", label: "Ask AI", group: "AI", icon: <IconSparkle />,
      run: () => { hooks?.onAsk?.(); },
    },
  ];
}
