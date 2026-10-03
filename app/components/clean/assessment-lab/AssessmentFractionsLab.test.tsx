// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";

function responses(values: boolean[]): MyLearnaAssessmentResponse[] {
  return values.map((correct, index) => ({
    itemId: `item-${index}`,
    selectedOptionIds: [],
    correct,
    skillId: `skill-${index}`,
    misconceptionTags: correct ? [] : ["gap"],
  }));
}

vi.mock("./AssessmentPlayerV1", () => ({
  default: ({
    title,
    onComplete,
  }: {
    title: string;
    onComplete?: (responses: MyLearnaAssessmentResponse[]) => void;
  }) =>
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          if (title.includes("P6 initial")) {
            onComplete?.(responses([false, false]));
            return;
          }
          if (title.includes("P3 branch")) {
            onComplete?.(responses([true, false]));
            return;
          }
          if (title.includes("P4 boundary")) {
            onComplete?.(responses([true, true, false]));
            return;
          }
          onComplete?.(responses([false, false, false]));
        },
      },
      title,
    ),
}));

import AssessmentFractionsLab from "./AssessmentFractionsLab";

afterEach(() => cleanup());

describe("AssessmentFractionsLab", () => {
  it("runs the generic adaptive engine through fraction boundary pools", () => {
    render(React.createElement(AssessmentFractionsLab));

    expect(screen.getByText("Interpreting fractions")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Interpreting fractions · P6 initial anchor",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Interpreting fractions · P3 branch anchor",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Interpreting fractions · P4 boundary probes",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Interpreting fractions · P5 boundary probes",
      }),
    );

    expect(screen.getByText("P4–P5")).toBeTruthy();
    expect(
      screen.getByText(/current assessment evidence is concentrated between P4 and P5/i),
    ).toBeTruthy();
    expect(screen.getByText("Provisional evidence band")).toBeTruthy();
    expect(
      screen.getByText(/equal-part or fractional number-line visuals/i),
    ).toBeTruthy();
    expect(
      screen.getByText("Interpreting fractions routing trace"),
    ).toBeTruthy();
  });
});
