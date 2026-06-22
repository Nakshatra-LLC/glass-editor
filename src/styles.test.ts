import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "styles.css"), "utf-8");

test("styles.css defines the theme token contract", () => {
  for (const token of ["--glass-bg", "--glass-fg", "--glass-accent", "--glass-popup-bg", "--glass-radius"]) {
    expect(css).toContain(token);
  }
});

test("styles.css ships a dark-mode block and styles the bubble buttons", () => {
  expect(css).toContain("prefers-color-scheme: dark");
  expect(css).toContain(".glass-bubble__btn");
  expect(css).toContain(".glass-slash__item");
});
