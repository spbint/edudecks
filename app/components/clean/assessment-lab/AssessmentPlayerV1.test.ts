// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import { MYLEARNA_ASSESS_DEMO_ITEMS } from "@/lib/clean/assessments/mylearnaAssessDemoItems";

describe("AssessmentPlayerV1", () => {
  it("runs the counter-card assessment from start to summary", () => {
    const { container } = render(
      React.createElement(AssessmentPlayerV1, {
        title: "Subitising proof of concept",
        items: MYLEARNA_ASSESS_DEMO_ITEMS,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Start assessment" }));

    expect(screen.getByText(/Question\s+1\s+of\s+8/)).toBeTruthy();
    expect(screen.getByLabelText("Four counters shown in a scattered arrangement.")).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="counter"]')).toHaveLength(4);

    fireEvent.click(screen.getByRole("radio", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(screen.getByText("Correct. You recognised the group of four.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next question" }));

    expect(screen.getByText(/Question\s+2\s+of\s+8/)).toBeTruthy();
    expect(screen.getByLabelText("Five counters shown in a clear five-frame arrangement.")).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="counter"]')).toHaveLength(5);

    fireEvent.click(screen.getByRole("radio", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(screen.getByText("Not quite. Look again at the full row of counters.")).toBeTruthy();

    for (let index = 2; index < MYLEARNA_ASSESS_DEMO_ITEMS.length; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Next question" }));
      const currentItem = MYLEARNA_ASSESS_DEMO_ITEMS[index];
      const correctOptionId = currentItem.response.correctOptionIds?.[0] || "";
      const correctOption = currentItem.response.options?.find((option) => option.id === correctOptionId);
      fireEvent.click(screen.getByRole("radio", { name: correctOption?.label || "" }));
      fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    }

    fireEvent.click(screen.getByRole("button", { name: "View summary" }));

    expect(screen.getByText("You answered 7 of 8 correctly.")).toBeTruthy();
    expect(screen.getByText("88%")).toBeTruthy();
    expect(screen.getByText("Suggested next step")).toBeTruthy();
  });
});
