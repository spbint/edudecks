// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GraduatedScaleVisual } from "./GraduatedScaleVisual";

afterEach(() => cleanup());

describe("GraduatedScaleVisual", () => {
  it("renders exact equal subdivisions and a deterministic pointer", () => {
    const { container } = render(
      React.createElement(GraduatedScaleVisual, {
        data: {
          min: 2,
          max: 3,
          majorStep: 1,
          subdivisions: 4,
          marker: 2.25,
          unit: "kg",
        },
      }),
    );

    expect(
      container.querySelectorAll('[data-testid="graduated-scale-tick"]'),
    ).toHaveLength(5);
    expect(
      container.querySelectorAll(
        '[data-testid="graduated-scale-tick"][data-major="true"]',
      ),
    ).toHaveLength(2);
    expect(
      container.querySelector('[data-testid="graduated-scale-marker"]'),
    ).not.toBeNull();
    expect(screen.getByRole("img").getAttribute("aria-label")).toMatch(
      /4 equal intervals/i,
    );
  });

  it("describes marker position structurally without announcing the numeric answer", () => {
    render(
      React.createElement(GraduatedScaleVisual, {
        data: {
          min: 2,
          max: 3,
          majorStep: 1,
          subdivisions: 4,
          marker: 2.25,
          unit: "kg",
        },
      }),
    );

    const label = screen.getByRole("img").getAttribute("aria-label") || "";
    expect(label).toMatch(/interval 1 of 4 after the first labelled value/i);
    expect(label).not.toContain("2.25");
  });

  it("fails closed when marker geometry cannot align to the graduated ticks", () => {
    render(
      React.createElement(GraduatedScaleVisual, {
        data: {
          min: 2,
          max: 3,
          majorStep: 1,
          subdivisions: 4,
          marker: 2.2,
          unit: "kg",
        },
      }),
    );

    expect(screen.getByText(/invalid graduated scale data/i)).toBeTruthy();
  });
});
