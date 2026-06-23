import { render } from "@testing-library/react";
import { expect, test } from "vitest";
import { IconPlus, IconGrip } from "./icons";

test("IconPlus renders an svg", () => {
  const { container } = render(<IconPlus />);
  expect(container.querySelector("svg")).not.toBeNull();
});

test("IconGrip renders an svg with six dots", () => {
  const { container } = render(<IconGrip />);
  const svg = container.querySelector("svg");
  expect(svg).not.toBeNull();
  expect(svg?.querySelectorAll("circle").length).toBe(6);
});
