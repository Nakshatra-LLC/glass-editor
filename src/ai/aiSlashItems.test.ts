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

test("Ask AI calls adapter.ask with context and instruction, then inserts the result", async () => {
  const ai = { continue: vi.fn(), ask: vi.fn().mockResolvedValue(" Formal text.") };
  const ed = fakeEditor();
  const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("Make it formal");
  const item = aiSlashItems(ai).find((i) => i.id === "ai-ask")!;
  await item.run(ed);
  expect(promptSpy).toHaveBeenCalled();
  expect(ai.ask).toHaveBeenCalledWith("Seed.", "Make it formal");
  expect(ed.inserted).toContain(" Formal text.");
  promptSpy.mockRestore();
});

test("Ask AI returns early when window.prompt is null", async () => {
  const ai = { continue: vi.fn(), ask: vi.fn() };
  const ed = fakeEditor();
  const promptSpy = vi.spyOn(window, "prompt").mockReturnValue(null);
  const item = aiSlashItems(ai).find((i) => i.id === "ai-ask")!;
  await item.run(ed);
  expect(promptSpy).toHaveBeenCalled();
  expect(ai.ask).not.toHaveBeenCalled();
  expect(ed.inserted).toHaveLength(0);
  promptSpy.mockRestore();
});
