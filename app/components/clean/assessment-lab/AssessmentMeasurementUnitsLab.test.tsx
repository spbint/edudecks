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
        onClick: () =>
          onComplete?.(
            title.includes("P6 initial")
              ? responses([false, false])
              : responses([true, false]),
          ),
      },
      title,
    ),
}));

import AssessmentMeasurementUnitsLab from "./AssessmentMeasurementUnitsLab";

afterEach(() => cleanup());

describe("AssessmentMeasurementUnitsLab", () => {
  it("routes from P6 down to the P3 practical anchor and preserves the evidence ceiling", () => {
    render(React.createElement(AssessmentMeasurementUnitsLab));

    expect(
      screen.getByText("Understanding units of measurement"),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Understanding units of measurement · P6 initial anchor",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Understanding units of measurement · P3 branch anchor",
      }),
    );

    expect(
      screen.getByText("Candidate measurement neighbourhood: P3–P6"),
    ).toBeTruthy();
    expect(
      screen.getByText(/requires actual use of informal measurement units/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/high-confidence lower-level placement requires observed use/i),
    ).toBeTruthy();
  });
});
