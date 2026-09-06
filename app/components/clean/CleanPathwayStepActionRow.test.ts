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

  it("makes an available first check the primary action while retaining worksheet and capture tools", () => {
    const { container } = render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        assessmentHref: "/assessments/number?learnerId=learner-a",
        emphasizePrimary: true,
        stepTitle: "Use place value",
        worksheetResource,
        onManualCompletionChange: vi.fn(),
      }),
    );

    expect(screen.getByRole("link", { name: "Check understanding" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark complete" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "View worksheet" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Download worksheet" })).toBeTruthy();

    const visibleText = container.textContent || "";
    expect(visibleText).toMatch(/Recommended next action/i);
    expect(container.querySelector('[data-pathway-primary-action="true"]')?.textContent).toBe(
      "Check understanding",
    );
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

  it("reports selected actions without changing canonical recommendation rendering", () => {
    const onActionSelected = vi.fn();
    const { container } = render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        assessmentHref: "/assessments/number?learnerId=learner-a",
        stepTitle: "Use place value",
        worksheetResource,
        onActionSelected,
      }),
    );

    fireEvent.click(screen.getByRole("link", { name: "Check understanding" }));
    fireEvent.click(screen.getByRole("link", { name: "View worksheet" }));

    expect(container.querySelector('[data-pathway-primary-action="true"]')?.textContent).toBe(
      "Check understanding",
    );
    expect(onActionSelected).toHaveBeenNthCalledWith(1, "check-understanding", true);
    expect(onActionSelected).toHaveBeenNthCalledWith(2, "worksheet", false);
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

  it("keeps the canonical Capture return URL for worksheet evidence", () => {
    render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref:
          "/my-capture?source=my-pathways&returnTo=%2Fmy-pathways%3FsubjectKey%3Dmathematics%26strandKey%3Dfractions-decimals-percentages%26learnerId%3Dlearner-a%23pathway-step-fractions-decimals-percentages-upper-primary-1",
        stepTitle: "Compare fractions",
        worksheetResource,
      }),
    );

    const href = screen.getByRole("link", { name: "Add completed work" }).getAttribute("href") || "";
    const url = new URL(href, "https://mylearna.test");

    expect(url.searchParams.get("returnTo")).toBe(
      "/my-pathways?subjectKey=mathematics&strandKey=fractions-decimals-percentages&learnerId=learner-a#pathway-step-fractions-decimals-percentages-upper-primary-1",
    );
    expect(url.searchParams.get("worksheetEvidence")).toBe("1");
    expect(url.searchParams.get("includeInPortfolio")).toBe("1");
    expect(url.searchParams.get("includeInReport")).toBe("1");
  });

  it("makes practice primary after a developing auto-check while retaining assessment", () => {
    const { container } = render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        practiceHref: "/practice/number-targeted?learnerId=learner-a",
        assessmentHref: "/assessments/number?learnerId=learner-a",
        autoCheckStatus: "Developing",
        stepTitle: "Compare fractions",
      }),
    );

    expect(container.querySelector('[data-pathway-primary-action="true"]')?.textContent).toBe(
      "Practise this focus",
    );
    expect(screen.getByRole("link", { name: "Check understanding" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
  });

  it("uses the existing next-step href as the secure recommendation", () => {
    const { container } = render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "/my-capture?source=my-pathways",
        nextStepHref: "/my-pathways?strandKey=operations#pathway-step-operations-stage-2",
        autoCheckStatus: "Secure",
        stepTitle: "Add and subtract",
      }),
    );

    expect(container.querySelector('[data-pathway-primary-action="true"] a')?.getAttribute("href")).toContain(
      "strandKey=operations",
    );
    expect(screen.getByRole("link", { name: "Add completed work" })).toBeTruthy();
  });
});
