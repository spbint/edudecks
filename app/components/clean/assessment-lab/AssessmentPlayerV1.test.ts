// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AssessmentPlayerV1 from "@/app/components/clean/assessment-lab/AssessmentPlayerV1";
import { MYLEARNA_ASSESS_DEMO_ITEMS } from "@/lib/clean/assessments/mylearnaAssessDemoItems";
import { COUNTING_P5_ANCHOR_ITEMS } from "@/lib/clean/assessments/placement/numberOperationsP0Items";

afterEach(() => cleanup());

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

  it("runs the Counting P5 short-answer anchor pair", () => {
    render(
      React.createElement(AssessmentPlayerV1, {
        title: "Counting P5 anchor mini-cluster",
        items: COUNTING_P5_ANCHOR_ITEMS,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Start assessment" }));

    const answer = screen.getByRole("textbox", { name: "Answer" });
    fireEvent.change(answer, { target: { value: "62" } });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("Correct.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Next question" }));
    expect(screen.getByLabelText(/quantity is intentionally not stated/i)).toBeTruthy();

    const secondAnswer = screen.getByRole("textbox", { name: "Answer" });
    fireEvent.change(secondAnswer, { target: { value: "14" } });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    expect(screen.getByText("Correct.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "View summary" }));
    expect(screen.getByText("You answered 2 of 2 correctly.")).toBeTruthy();
  });

  it("supports multi-select responses without collapsing them to radio buttons", () => {
    const item = {
      ...MYLEARNA_ASSESS_DEMO_ITEMS[0],
      id: "multi-select-proof",
      response: {
        type: "multiple-choice" as const,
        options: [
          { id: "a", label: "A", value: "a" },
          { id: "b", label: "B", value: "b" },
          { id: "c", label: "C", value: "c" },
        ],
        correctOptionIds: ["a", "c"],
      },
    };

    render(
      React.createElement(AssessmentPlayerV1, {
        title: "Multi-select proof",
        items: [item],
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Start assessment" }));
    expect(screen.getByText("Select every answer that applies")).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "A" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "C" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(screen.getByText(item.feedback.correct)).toBeTruthy();
  });


  it("hides correctness and percentage feedback in placement mode", () => {
    const onComplete = vi.fn();
    render(
      React.createElement(AssessmentPlayerV1, {
        title: "Placement proof",
        items: [COUNTING_P5_ANCHOR_ITEMS[0]],
        mode: "placement",
        onComplete,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Start assessment" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Answer" }), {
      target: { value: "62" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));

    expect(screen.getByText("Response recorded.")).toBeTruthy();
    expect(screen.queryByText("Correct. 62 comes immediately before 63.")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "View summary" }));
    expect(screen.getByText("Responses recorded for routing.")).toBeTruthy();
    expect(screen.queryByText("100%")).toBeNull();
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0][0].correct).toBe(true);
  });

});
