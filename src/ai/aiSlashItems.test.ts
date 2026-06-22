import { vi, expect, test } from "vitest";
import { aiSlashItems } from "./aiSlashItems";

test("ai-continue calls onContinue hook instead of running ai.continue", () => {
  const ai = { continue: vi.fn(), ask: vi.fn() };
  const onContinue = vi.fn();
  const ed = { getText: () => "", commands: { insertContent: vi.fn() } } as any;
  aiSlashItems(ai, { onContinue }).find((i) => i.id === "ai-continue")!.run(ed);
  expect(onContinue).toHaveBeenCalled();
  expect(ai.continue).not.toHaveBeenCalled();
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
