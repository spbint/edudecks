// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AssessmentNumberOperationsProfileCard from "./AssessmentNumberOperationsProfileCard";
import { buildNumberOperationsProfile } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import { buildNumberOperationsCandidateBandResult } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

afterEach(() => cleanup());

describe("AssessmentNumberOperationsProfileCard", () => {
  it("shows independent sub-element bands rather than one averaged level", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 6,
        upperP: 7,
      }),
      buildNumberOperationsCandidateBandResult({
        subElementKey: "multiplicative-strategies",
        lowerP: 4,
        upperP: 5,
      }),
    ]);

    render(
      React.createElement(AssessmentNumberOperationsProfileCard, { profile }),
    );

    expect(screen.getByText("A profile, not one averaged level")).toBeTruthy();
    expect(screen.getByText("Number and place value")).toBeTruthy();
    expect(screen.getByText("P6–P7")).toBeTruthy();
    expect(screen.getByText("Multiplicative strategies")).toBeTruthy();
    expect(screen.getByText("P4–P5")).toBeTruthy();
    expect(screen.getAllByText(/2 of 5 sub-elements/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Recommended next learning actions")).toBeTruthy();
    expect(screen.getByText("Practise toward P7")).toBeTruthy();
    expect(screen.getByText("Practise toward P5")).toBeTruthy();
    expect(screen.getAllByText("Resource/Pathways link not mapped yet.")).toHaveLength(2);
  });
});
