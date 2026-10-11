// @vitest-environment jsdom

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AssessmentPlacementResultCard from "./AssessmentPlacementResultCard";
import {
  buildNpvCandidateBandResult,
  buildNpvEndpointResult,
} from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";

describe("AssessmentPlacementResultCard", () => {
  it("presents an adjacent NPV evidence band without foregrounding a percentage", () => {
    render(
      React.createElement(AssessmentPlacementResultCard, {
        result: buildNpvCandidateBandResult({ lowerP: 4, upperP: 5 }),
      }),
    );

    expect(screen.getByText("Number and place value")).toBeTruthy();
    expect(screen.getByText("P4–P5")).toBeTruthy();
    expect(screen.getByText("Provisional evidence band")).toBeTruthy();
    expect(
      screen.getByText(/current assessment evidence is concentrated between P4 and P5/i),
    ).toBeTruthy();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("uses open-ended endpoint wording at P10", () => {
    render(
      React.createElement(AssessmentPlacementResultCard, {
        result: buildNpvEndpointResult({
          relation: "at-least",
          pLevel: 10,
        }),
      }),
    );

    expect(screen.getByText("At least P10")).toBeTruthy();
    expect(
      screen.getByText(/current evidence reaches at least P10/i),
    ).toBeTruthy();
  });
});
