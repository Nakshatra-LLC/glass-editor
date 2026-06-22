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

test("ai-continue does not throw when adapter rejects and inserts nothing", async () => {
  const ai = { continue: vi.fn().mockRejectedValue(new Error("boom")), ask: vi.fn() };
  const ed = fakeEditor();
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const item = aiSlashItems(ai).find((i) => i.id === "ai-continue")!;
  await expect(item.run(ed)).resolves.toBeUndefined();
  expect(ed.inserted).toHaveLength(0);
  expect(errorSpy).toHaveBeenCalledWith("glass-editor: AI request failed", expect.any(Error));
  errorSpy.mockRestore();
});

test("ai-ask invokes the onAsk hook instead of window.prompt", () => {
  const ai = { continue: vi.fn(), ask: vi.fn() };
  const onAsk = vi.fn();
  const ed = { getText: () => "", commands: { insertContent: vi.fn() } } as any;
  aiSlashItems(ai, { onAsk }).find((i) => i.id === "ai-ask")!.run(ed);
  expect(onAsk).toHaveBeenCalled();
  expect(ai.ask).not.toHaveBeenCalled();
});

test("ai items carry the AI group and an icon", () => {
  const items = aiSlashItems({ continue: vi.fn(), ask: vi.fn() });
  for (const i of items) { expect(i.group).toBe("AI"); expect(i.icon).toBeDefined(); }
});
