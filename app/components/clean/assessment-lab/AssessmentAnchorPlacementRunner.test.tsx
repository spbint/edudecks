// @vitest-environment jsdom

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AssessmentAnchorPlacementRunner from "./AssessmentAnchorPlacementRunner";

function startCurrentCluster() {
  fireEvent.click(screen.getByRole("button", { name: "Start assessment" }));
}

function finishCurrentQuestion() {
  fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
  fireEvent.click(
    screen.getByRole("button", {
      name: /Next question|View summary/,
    }),
  );
}

describe("AssessmentAnchorPlacementRunner", () => {
  it("routes a learner from NPV P6 down to a P3-P6 candidate neighbourhood", () => {
    render(
      React.createElement(AssessmentAnchorPlacementRunner, {
        anchorSetKey: "number-place-value",
      }),
    );

    expect(screen.getByText("Initial anchor · P6")).toBeTruthy();
    startCurrentCluster();

    // Deliberately miss the P6 flexible-renaming item.
    fireEvent.click(
      screen.getByRole("checkbox", { name: "4 thousands and 30 hundreds" }),
    );
    finishCurrentQuestion();

    // Deliberately miss the P6 rounding item.
    fireEvent.change(screen.getByRole("textbox", { name: "Answer" }), {
      target: { value: "3400" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(screen.getByRole("button", { name: "View summary" }));

    expect(screen.getByText("Lower branch · P3")).toBeTruthy();
    startCurrentCluster();

    // One supported P3 construct is enough to reverse the down-search into a P3-P6 bracket.
    fireEvent.click(screen.getByRole("radio", { name: "17" }));
    finishCurrentQuestion();

    fireEvent.change(screen.getByRole("textbox", { name: "Answer" }), {
      target: { value: "15" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(screen.getByRole("button", { name: "View summary" }));

    expect(screen.getByText(/Boundary search · P4 within P3–P6/)).toBeTruthy();
    startCurrentCluster();

    // Support P4 on two of three independent probes.
    fireEvent.click(screen.getByRole("radio", { name: "108" }));
    finishCurrentQuestion();

    for (const label of [
      "6 tens and 8 ones",
      "68 ones",
      "60 + 8",
    ]) {
      fireEvent.click(screen.getByRole("checkbox", { name: label }));
    }
    finishCurrentQuestion();

    fireEvent.click(screen.getByRole("radio", { name: "38" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(screen.getByRole("button", { name: "View summary" }));

    expect(screen.getByText(/Boundary search · P5 within P4–P6/)).toBeTruthy();
    startCurrentCluster();

    // Deliberately fail the P5 probes so the bracket narrows to P4-P5.
    fireEvent.click(screen.getByRole("radio", { name: "267" }));
    finishCurrentQuestion();

    fireEvent.click(screen.getByRole("checkbox", { name: "2 hundreds, 7 tens and 4 ones" }));
    finishCurrentQuestion();

    fireEvent.change(screen.getByRole("textbox", { name: "Answer" }), {
      target: { value: "870" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(screen.getByRole("button", { name: "View summary" }));

    expect(screen.getByText("P4–P5")).toBeTruthy();
    expect(
      screen.getByText(/current assessment evidence is concentrated between P4 and P5/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/verify P5 across more than one construct/i),
    ).toBeTruthy();
    expect(screen.queryByText(/100%/)).toBeNull();
  });
});
