// @vitest-environment jsdom

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AssessmentNumeracySpineLab from "./AssessmentNumeracySpineLab";

afterEach(() => cleanup());

describe("AssessmentNumeracySpineLab", () => {
  it("shows all 14 source sub-elements and the current five implemented lanes", () => {
    render(React.createElement(AssessmentNumeracySpineLab));

    expect(screen.getByText("Complete numeracy progression spine")).toBeTruthy();
    expect(screen.getByText(/3 source elements · 14 sub-elements/i)).toBeTruthy();
    expect(screen.getAllByText("Adaptive first slice implemented")).toHaveLength(5);
    expect(screen.getAllByText("Blueprint next")).toHaveLength(9);
  });

  it("shows the three source elements", () => {
    render(React.createElement(AssessmentNumeracySpineLab));

    expect(screen.getByText("Number sense and algebra")).toBeTruthy();
    expect(screen.getByText("Measurement and geometry")).toBeTruthy();
    expect(screen.getByText("Statistics and probability")).toBeTruthy();
  });
});
