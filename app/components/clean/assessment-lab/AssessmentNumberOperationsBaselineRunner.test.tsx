// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildNumberOperationsCandidateBandResult } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import { buildNumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";

vi.mock("./AssessmentAnchorPlacementRunner", () => ({
  default: ({
    anchorSetKey,
    onResult,
    onAttemptTrace,
  }: {
    anchorSetKey: string;
    onResult?: (result: unknown) => void;
    onAttemptTrace?: (trace: unknown) => void;
  }) =>
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const subElementKey = anchorSetKey as
            | "number-place-value"
            | "counting-processes"
            | "additive-strategies"
            | "multiplicative-strategies"
            | "understanding-money";
          const result = buildNumberOperationsCandidateBandResult({
            subElementKey,
            lowerP: 5,
            upperP: 6,
          });
          onResult?.(result);
          onAttemptTrace?.(
            buildNumberOperationsSubElementAttemptTrace({
              subElementKey,
              subElementLabel: anchorSetKey,
              stages: [
                {
                  stage: "initial",
                  pLevel: 5,
                  responses: [
                    {
                      itemId: `${anchorSetKey}-item`,
                      selectedOptionIds: ["a"],
                      correct: true,
                      skillId: `${anchorSetKey}-skill`,
                      misconceptionTags: [],
                    },
                  ],
                },
              ],
              routeTrace: [],
              result,
            }),
          );
        },
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
    expect(screen.getAllByText("P5–P6")).toHaveLength(10);
    expect(screen.getByText("Assessment evidence preview")).toBeTruthy();
    expect(screen.getByText("Not saved yet")).toBeTruthy();
    expect(
      screen.getByText(/can become Portfolio and report evidence after explicit parent confirmation/i),
    ).toBeTruthy();
    expect(screen.getByText(/Baseline data handoff · schema v1/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Baseline data handoff · schema v1/i));
    expect(screen.getByText(/not written to the existing pathway-scoped assessment_attempts table/i)).toBeTruthy();
    expect(screen.getByText(/"pathwayAttemptCompatible": false/i)).toBeTruthy();
    expect(screen.getByText(/Future persistence rows · 5 responses/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/Future persistence rows · 5 responses/i));
    expect(
      screen.getByText(/No family ID, learner ID, database ID or user ID is created here/i),
    ).toBeTruthy();
  });
});
