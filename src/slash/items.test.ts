import { defaultSlashItems } from "./items";

function fakeEditor() {
  const calls: string[] = [];
  const chain: any = new Proxy({}, { get: (_t, p) => (..._a: unknown[]) => { if (p !== "run" && p !== "focus") calls.push(String(p)); return chain; } });
  return { calls, chain: () => chain } as any;
}

test("ships block items that run editor commands", () => {
  const ids = defaultSlashItems.map((i) => i.id);
  expect(ids).toEqual(expect.arrayContaining(["h2", "bulletList", "taskList", "codeBlock", "divider"]));
  const ed = fakeEditor();
  defaultSlashItems.find((i) => i.id === "h2")!.run(ed);
  expect(ed.calls).toContain("toggleHeading");
});
