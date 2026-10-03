// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildNumberOperationsCandidateBandResult } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

vi.mock("./AssessmentAnchorPlacementRunner", () => ({
  default: ({
    anchorSetKey,
    onResult,
  }: {
    anchorSetKey: string;
    onResult?: (result: unknown) => void;
  }) =>
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () =>
          onResult?.(
            buildNumberOperationsCandidateBandResult({
              subElementKey: anchorSetKey as
                | "number-place-value"
                | "counting-processes"
                | "additive-strategies"
                | "multiplicative-strategies"
                | "understanding-money",
              lowerP: 5,
              upperP: 6,
            }),
          ),
      },
      `Complete ${anchorSetKey}`,
    ),
}));

import AssessmentNumberOperationsBaselineRunner from "./AssessmentNumberOperationsBaselineRunner";

afterEach(() => cleanup());

describe("AssessmentNumberOperationsBaselineRunner", () => {
  it("collects five independent area results into one profile", () => {
    render(React.createElement(AssessmentNumberOperationsBaselineRunner));

    const keys = [
      "number-place-value",
      "counting-processes",
      "additive-strategies",
      "multiplicative-strategies",
      "understanding-money",
    ];

    for (let index = 0; index < keys.length; index += 1) {
      fireEvent.click(
        screen.getByRole("button", { name: `Complete ${keys[index]}` }),
      );
      const continueLabel =
        index === keys.length - 1
          ? "View Number & Operations profile"
          : "Continue to next area";
      fireEvent.click(screen.getByRole("button", { name: continueLabel }));
    }

    expect(screen.getByText("A profile, not one averaged level")).toBeTruthy();
    expect(screen.getByText(/5 of 5 sub-elements/i)).toBeTruthy();
    expect(screen.getAllByText("P5–P6")).toHaveLength(5);
  });
});
