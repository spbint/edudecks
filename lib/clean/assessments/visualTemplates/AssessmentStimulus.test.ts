// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssessmentStimulus } from "@/lib/clean/assessments/visualTemplates";

describe("AssessmentStimulus visual templates", () => {
  it("renders an exact deterministic counter set", () => {
    const stimulus = {
      type: "counter-set",
      data: { quantity: 4, arrangement: "scattered", seed: 1204 },
      altText: "Four counters shown in a scattered arrangement.",
    };

    const first = render(React.createElement(AssessmentStimulus, { stimulus }));
    expect(screen.getByLabelText("Four counters shown in a scattered arrangement.")).toBeTruthy();
    expect(first.container.querySelectorAll('[data-testid="counter"]')).toHaveLength(4);
    const firstLayout = Array.from(first.container.querySelectorAll('[data-testid="counter"] circle:first-child')).map(
      (node) => `${node.getAttribute("cx")},${node.getAttribute("cy")}`,
    );
    first.unmount();

    const second = render(React.createElement(AssessmentStimulus, { stimulus }));
    const secondLayout = Array.from(second.container.querySelectorAll('[data-testid="counter"] circle:first-child')).map(
      (node) => `${node.getAttribute("cx")},${node.getAttribute("cy")}`,
    );
    expect(secondLayout).toEqual(firstLayout);
  });

  it("renders ten frames with exact filled counts including 0 and 10", () => {
    const empty = render(
      React.createElement(AssessmentStimulus, {
        stimulus: { type: "ten-frame", data: { filled: 0 } },
      }),
    );
    expect(empty.container.querySelectorAll('[data-testid="ten-frame-cell"], [data-testid="ten-frame-cell-filled"]')).toHaveLength(10);
    expect(empty.container.querySelectorAll('[data-testid="ten-frame-cell-filled"]')).toHaveLength(0);
    empty.unmount();

    const full = render(
      React.createElement(AssessmentStimulus, {
        stimulus: { type: "ten-frame", data: { filled: 10 } },
      }),
    );
    expect(full.container.querySelectorAll('[data-testid="ten-frame-cell"], [data-testid="ten-frame-cell-filled"]')).toHaveLength(10);
    expect(full.container.querySelectorAll('[data-testid="ten-frame-cell-filled"]')).toHaveLength(10);
  });

  it("renders a number line marker and hidden labels", () => {
    const { container } = render(
      React.createElement(AssessmentStimulus, {
        stimulus: {
          type: "number-line",
          data: { min: 0, max: 10, step: 1, marker: 6, hiddenLabels: [6] },
        },
      }),
    );

    const marker = screen.getByTestId("number-line-marker");
    expect(marker.getAttribute("data-marker-value")).toBe("6");
    expect(container.textContent).toContain("?");
  });

  it("renders array items from rows and columns", () => {
    const { container } = render(
      React.createElement(AssessmentStimulus, {
        stimulus: { type: "array", data: { rows: 3, columns: 4 } },
      }),
    );

    expect(screen.getByLabelText("Array with 3 rows and 4 columns, showing 12 items.")).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="array-item"]')).toHaveLength(12);
  });

  it("renders place-value blocks for hundreds, tens and ones", () => {
    const { container } = render(
      React.createElement(AssessmentStimulus, {
        stimulus: { type: "place-value-blocks", data: { hundreds: 2, tens: 3, ones: 6 } },
      }),
    );

    expect(screen.getByLabelText("Place-value blocks showing 2 hundreds, 3 tens, 6 ones.")).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="place-value-hundred"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-testid="place-value-ten"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-testid="place-value-one"]')).toHaveLength(6);
  });

  it("renders fraction bars with exact denominator and numerator counts", () => {
    const { container } = render(
      React.createElement(AssessmentStimulus, {
        stimulus: { type: "fraction-bar", data: { numerator: 3, denominator: 4 } },
      }),
    );

    expect(screen.getByLabelText("Fraction bar showing 3 out of 4 equal parts shaded.")).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="fraction-part"], [data-testid="fraction-part-filled"]')).toHaveLength(4);
    expect(container.querySelectorAll('[data-testid="fraction-part-filled"]')).toHaveLength(3);
  });

  it("renders shape sets with expected shape counts", () => {
    const { container } = render(
      React.createElement(AssessmentStimulus, {
        stimulus: {
          type: "shape-set",
          data: {
            arrangement: "scattered",
            seed: 321,
            shapes: [
              { type: "triangle", count: 3 },
              { type: "circle", count: 2 },
            ],
          },
        },
      }),
    );

    expect(container.querySelectorAll('[data-testid="shape-triangle"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-testid="shape-circle"]')).toHaveLength(2);
  });

  it("fails gracefully for unsupported stimulus types", () => {
    render(
      React.createElement(AssessmentStimulus, {
        stimulus: { type: "unknown-visual", data: {} },
      }),
    );

    expect(screen.getByTestId("invalid-stimulus")).toBeTruthy();
  });
});
