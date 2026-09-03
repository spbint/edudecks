// @vitest-environment jsdom

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import CleanPathwayStepActionRow from "@/app/components/clean/CleanPathwayStepActionRow";
import type { MathWorksheetResource } from "@/lib/clean/resources/mathWorksheetResources";

const worksheetResource: MathWorksheetResource = {
  pathwayStepId: "mathematics:number-and-place-value:upper-elementary:step-1",
  stepKey: "use-place-value",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "upper-elementary",
  stageDisplay: "Upper Elementary",
  stepNumber: 1,
  pathwayStepTitle: "Use place value",
  title: "Use Place Value",
  fileName: "MYL-MATH-NPV-UE-S001-Use-Place-Value.pdf",
  href: "/resources/worksheets/maths/number-and-place-value/upper-elementary/MYL-MATH-NPV-UE-S001-Use-Place-Value.pdf",
  resourceType: "worksheet-pdf",
};

describe("CleanPathwayStepActionRow", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders customer-safe worksheet and evidence actions without retired practice or assessment labels", () => {
    const { container } = render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        stepTitle: "Use place value",
        worksheetResource,
        onManualCompletionChange: vi.fn(),
      }),
    );

    expect(screen.getByRole("button", { name: "Mark complete" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "View worksheet" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Download worksheet" })).toBeTruthy();

    const visibleText = container.textContent || "";
    expect(visibleText).not.toMatch(/Digital Practice/i);
    expect(visibleText).not.toMatch(/Practice activities/i);
    expect(visibleText).not.toMatch(/Practise/i);
    expect(visibleText).not.toMatch(/Assessments ready/i);
    expect(visibleText).not.toMatch(/Latest assessment/i);
    expect(visibleText).not.toMatch(/Start assessment/i);
    expect(visibleText).not.toMatch(/Start practice/i);
    expect(visibleText).not.toMatch(/Optional digital tools/i);
  });

  it("keeps Mark complete separate from adding completed work", () => {
    const onManualCompletionChange = vi.fn();
    render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        stepTitle: "Use place value",
        worksheetResource,
        onManualCompletionChange,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));

    expect(onManualCompletionChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
  });

  it("keeps exact practice and assessment links available without changing evidence actions", () => {
    render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        practiceHref:
          "/practice/number-targeted?learnerId=learner-a&strandKey=fractions-decimals-percentages",
        assessmentHref:
          "/assessments/number?learnerId=learner-a&strandKey=fractions-decimals-percentages",
        stepTitle: "Compare fractions",
        worksheetResource,
      }),
    );

    expect(screen.getByRole("link", { name: "Practise" }).getAttribute("href")).toContain(
      "strandKey=fractions-decimals-percentages",
    );
    expect(
      screen.getByRole("link", { name: "Check understanding" }).getAttribute("href"),
    ).toContain("learnerId=learner-a");
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
  });

  it("does not show active Mark complete once the step is complete", () => {
    render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        stepTitle: "Use place value",
        worksheetResource,
        manualComplete: true,
        onManualCompletionChange: vi.fn(),
      }),
    );

    expect(screen.queryByRole("button", { name: "Mark complete" })).toBeNull();
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
  });

  it("uses the same action renderer for non-worksheet steps without worksheet actions", () => {
    render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        stepTitle: "Use place value",
        worksheetResource: null,
        onManualCompletionChange: vi.fn(),
      }),
    );

    expect(screen.getByRole("button", { name: "Mark complete" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "View worksheet" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Download worksheet" })).toBeNull();
  });
});
