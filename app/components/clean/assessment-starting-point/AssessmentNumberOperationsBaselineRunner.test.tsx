// @vitest-environment jsdom

import React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildNumberOperationsCandidateBandResult } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import { buildNumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";
import { NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY } from "@/lib/clean/assessments/placement/numberOperationsBaselineDraft";

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

beforeEach(() => window.sessionStorage.clear());
afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

describe("AssessmentNumberOperationsBaselineRunner", () => {
  it("collects five independent area results into one profile", () => {
    render(React.createElement(AssessmentNumberOperationsBaselineRunner));

    expect(screen.getByText("Adaptive question budget")).toBeTruthy();
    expect(screen.getByText(/bounded between \d+ and \d+ questions/i)).toBeTruthy();

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
    expect(
      window.sessionStorage.getItem(
        NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY,
      ),
    ).toBeNull();
  });

  it("resumes completed areas from browser-local session storage", async () => {
    const first = render(
      React.createElement(AssessmentNumberOperationsBaselineRunner),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Complete number-place-value" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue to next area" }),
    );

    await waitFor(() => {
      const raw = window.sessionStorage.getItem(
        NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY,
      );
      expect(raw).toBeTruthy();
      expect(JSON.parse(raw || "{}").currentIndex).toBe(1);
    });

    first.unmount();

    render(React.createElement(AssessmentNumberOperationsBaselineRunner));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Complete counting-processes" }),
      ).toBeTruthy();
    });
    expect(screen.getByText(/Area 2 of 5/i)).toBeTruthy();
    expect(
      screen.getByText(/completed areas are saved only in this browser tab/i),
    ).toBeTruthy();
  });
});


it("keeps a completed browser-only profile available for the practice-return loop", () => {
  const source = readFileSync(
    join(
      process.cwd(),
      "app/components/clean/assessment-starting-point/AssessmentNumberOperationsBaselineRunner.tsx",
    ),
    "utf8",
  );

  expect(source).toContain('draft.status === "complete"');
  expect(source).toContain('setComplete(true)');
  expect(source).toContain('status: complete ? "complete" : "in_progress"');
  expect(source).not.toContain(
    "if (complete) {\n      window.sessionStorage.removeItem",
  );
  expect(source).toContain("hydratedCompleteRef.current");
});
