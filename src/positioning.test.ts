import { clampPopup } from "./positioning";

const vp = { width: 1000, height: 800 };

test("places popup below the anchor when it fits", () => {
  const pos = clampPopup({ top: 100, bottom: 120, left: 50 }, { width: 200, height: 150 }, vp);
  expect(pos).toEqual({ top: 124, left: 50 });
});

test("flips above the anchor when it would overflow the bottom", () => {
  const pos = clampPopup({ top: 700, bottom: 720, left: 50 }, { width: 200, height: 150 }, vp);
  expect(pos.top).toBe(700 - 150 - 4);
  expect(pos.left).toBe(50);
});

test("clamps left so the popup stays in the viewport", () => {
  const pos = clampPopup({ top: 100, bottom: 120, left: 950 }, { width: 200, height: 150 }, vp);
  expect(pos.left).toBe(1000 - 200 - 8);
});
