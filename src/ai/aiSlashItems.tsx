import type { SlashItem } from "../slash/items";
import { IconSparkle } from "../slash/icons";

export type AiAdapter = {
  continue: (context: string) => Promise<string>;
  ask: (context: string, instruction: string) => Promise<string>;
};

export function aiSlashItems(ai: AiAdapter, hooks?: { onAsk?: () => void; onContinue?: () => void }): SlashItem[] {
  return [
    {
      id: "ai-continue", label: "Continue Writing", group: "AI", icon: <IconSparkle />,
      run: () => { hooks?.onContinue?.(); },
    },
    {
      id: "ai-ask", label: "Ask AI", group: "AI", icon: <IconSparkle />,
      run: () => { hooks?.onAsk?.(); },
    },
  ];
}
