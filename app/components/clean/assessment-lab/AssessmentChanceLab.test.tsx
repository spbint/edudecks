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
          if (title.includes("P4 initial")) {
            onComplete?.(responses([false, false]));
            return;
          }
          if (title.includes("P2 branch")) {
            onComplete?.(responses([true, false]));
            return;
          }
          onComplete?.(responses([true, true, false]));
        },
      },
      title,
    ),
}));

import AssessmentChanceLab from "./AssessmentChanceLab";

afterEach(() => cleanup());

describe("AssessmentChanceLab", () => {
  it("routes from numerical probability toward fairness/independence and returns a P3-P4 evidence band", () => {
    render(React.createElement(AssessmentChanceLab));

    expect(screen.getByText("Understanding chance")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Understanding chance · P4 initial anchor",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Understanding chance · P2 branch anchor",
      }),
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Understanding chance · P3 boundary probes",
      }),
    );

    expect(screen.getByText("P3–P4")).toBeTruthy();
    expect(
      screen.getByText(/current assessment evidence is concentrated between P3 and P4/i),
    ).toBeTruthy();
    expect(screen.getByText("Provisional evidence band")).toBeTruthy();
    expect(
      screen.getByText(/fairness, possible outcomes, equal likelihood and independence/i),
    ).toBeTruthy();
    expect(screen.getByText("Chance routing trace")).toBeTruthy();
  });
});
