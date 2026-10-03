// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MyLearnaAssessmentResponse } from "@/lib/clean/assessments/mylearnaAssessTypes";

function responses(prefix: string, values: boolean[]): MyLearnaAssessmentResponse[] {
  return values.map((correct, index) => ({
    itemId: `${prefix}-${index}`,
    selectedOptionIds: [],
    correct,
    skillId: `${prefix}-skill-${index}`,
    misconceptionTags: correct ? [] : ["gap"],
  }));
}

vi.mock("./AssessmentPlayerV1", () => ({
  default: ({ title, onComplete }: { title: string; onComplete?: (responses: MyLearnaAssessmentResponse[]) => void }) =>
    React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          const upper = title.includes("P5 confirmation");
          onComplete?.(responses(upper ? "upper" : "lower", upper ? [true, false] : [true, true]));
        },
      },
      title,
    ),
}));

import AssessmentNpvBandConfirmation from "./AssessmentNpvBandConfirmation";

afterEach(() => cleanup());

describe("AssessmentNpvBandConfirmation", () => {
  it("runs two fresh sides and reports the evidence statement rather than a percentage", () => {
    const onConfirmed = vi.fn();
    render(
      React.createElement(AssessmentNpvBandConfirmation, {
        lowerP: 4,
        upperP: 5,
        onConfirmed,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm this band" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Number and place value · fresh P4 confirmation",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Number and place value · fresh P5 confirmation",
      }),
    );

    expect(
      screen.getByText(/Fresh evidence supports P4 indicators; P5 is not yet consistently demonstrated/i),
    ).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(onConfirmed.mock.calls[0][0]).toMatchObject({
      outcome: "lower-supported-upper-not-yet",
      confidence: "confirmation-supported",
    });
  });
});