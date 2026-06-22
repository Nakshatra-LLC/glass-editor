import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(__dirname, "styles.css"), "utf-8");

test("styles.css defines the theme token contract", () => {
  for (const token of ["--clean-bg", "--clean-fg", "--clean-accent", "--clean-popup-bg", "--clean-radius"]) {
    expect(css).toContain(token);
  }
});

test("styles.css ships a dark-mode block and styles the bubble buttons", () => {
  expect(css).toContain("prefers-color-scheme: dark");
  expect(css).toContain(".clean-bubble__btn");
  expect(css).toContain(".clean-slash__item");
});

test("styles.css styles links with the accent color", () => {
  expect(css).toContain(".clean-editor__content a");
});

test("styles.css supports data-theme forced dark override", () => {
  expect(css).toContain('[data-theme="dark"]');
});

test("styles.css defines the clean-askai-layer rule", () => {
  expect(css).toContain(".clean-askai-layer");
});
