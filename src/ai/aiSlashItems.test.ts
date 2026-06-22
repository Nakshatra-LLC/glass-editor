import { vi, expect, test } from "vitest";
import { aiSlashItems } from "./aiSlashItems";

function fakeEditor() {
  const inserted: string[] = [];
  return { getText: () => "Seed.", commands: { insertContent: (t: string) => inserted.push(t) }, inserted } as any;
}

test("Continue Writing calls adapter.continue and inserts the result", async () => {
  const ai = { continue: vi.fn().mockResolvedValue(" More."), ask: vi.fn() };
  const ed = fakeEditor();
  const item = aiSlashItems(ai).find((i) => i.id === "ai-continue")!;
  await item.run(ed);
  expect(ai.continue).toHaveBeenCalledWith("Seed.");
  expect(ed.inserted).toContain(" More.");
});
