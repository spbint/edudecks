// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { NumberLineVisual } from "./NumberLineVisual";

afterEach(() => cleanup());

describe("NumberLineVisual", () => {
  it("renders fractional tick intervals exactly", () => {
    const { container } = render(
      React.createElement(NumberLineVisual, {
        data: {
          min: 0,
          max: 1,
          step: 0.25,
          marker: 0.5,
        },
        altText:
          "Number line from zero to one divided into four equal intervals, with a marker on the second interior division.",
      }),
    );

    const labels = Array.from(container.querySelectorAll("text")).map(
      (node) => node.textContent,
    );
    expect(labels).toEqual(
      expect.arrayContaining(["0", "0.25", "0.5", "0.75", "1"]),
    );
    expect(
      container.querySelectorAll('[data-testid="number-line-marker"]'),
    ).toHaveLength(1);
  });

  it("handles repeating decimal interval geometry without duplicate end ticks", () => {
    const { container } = render(
      React.createElement(NumberLineVisual, {
        data: {
          min: 0,
          max: 1,
          step: 1 / 3,
          marker: 2 / 3,
          hiddenLabels: [1 / 3, 2 / 3],
        },
        altText:
          "Number line from zero to one divided into three equal intervals, with a marker on the second interior division.",
      }),
    );

    const questionMarks = Array.from(container.querySelectorAll("text")).filter(
      (node) => node.textContent === "?",
    );
    expect(questionMarks).toHaveLength(2);

    const labels = Array.from(container.querySelectorAll("text")).map(
      (node) => node.textContent,
    );
    expect(labels.filter((label) => label === "1")).toHaveLength(1);
  });

  it("fails closed for non-positive interval steps", () => {
    render(
      React.createElement(NumberLineVisual, {
        data: {
          min: 0,
          max: 1,
          step: 0,
        },
      }),
    );

    expect(
      screen.getByText(/number-line step must be greater than zero/i),
    ).toBeTruthy();
  });
});
