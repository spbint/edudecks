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

  it("hides unavailable assessment and practice actions while retaining portfolio and worksheet tools", () => {
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

    expect(screen.queryByRole("link", { name: "Check understanding" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Practise/i })).toBeNull();
    expect(screen.getByRole("button", { name: "Mark complete" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "View worksheet" })).toBeNull();
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Download worksheet" })).toBeTruthy();

    const visibleText = container.textContent || "";
    expect(visibleText).toMatch(/Recommended next action/i);
    expect(container.querySelector('[data-pathway-primary-action="true"]')?.textContent).toBe(
      "Add to Portfolio",
    );
  });

  it("keeps Mark complete separate from adding to Portfolio", () => {
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
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
  });

  it("reports selected portfolio actions without exposing unavailable checks", () => {
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

    fireEvent.click(screen.getByRole("link", { name: "Add to Portfolio" }));

    expect(container.querySelector('[data-pathway-primary-action="true"]')?.textContent).toBe(
      "Add to Portfolio",
    );
    expect(onActionSelected).toHaveBeenNthCalledWith(1, "capture-evidence", true);
    expect(onActionSelected).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("link", { name: "Check understanding" })).toBeNull();
    expect(screen.queryByRole("link", { name: "View worksheet" })).toBeNull();
  });

  it("keeps underlying assessment and practice href props available while hiding customer access", () => {
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

    expect(screen.queryByRole("link", { name: /Practise/i })).toBeNull();
    expect(screen.queryByRole("link", { name: "Check understanding" })).toBeNull();
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
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
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
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
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
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

    const href = screen.getByRole("link", { name: "Add to Portfolio" }).getAttribute("href") || "";
    const url = new URL(href, "https://mylearna.test");

    expect(url.searchParams.get("returnTo")).toBe(
      "/my-pathways?subjectKey=mathematics&strandKey=fractions-decimals-percentages&learnerId=learner-a#pathway-step-fractions-decimals-percentages-upper-primary-1",
    );
    expect(url.searchParams.get("worksheetEvidence")).toBe("1");
    expect(url.searchParams.get("includeInPortfolio")).toBe("1");
    expect(url.searchParams.get("includeInReport")).toBe("1");
  });

  it("falls back through the canonical resolver when customer Practice and assessments are unavailable", () => {
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
      "Add to Portfolio",
    );
    expect(screen.queryByRole("link", { name: /Practise/i })).toBeNull();
    expect(screen.queryByRole("link", { name: "Check understanding" })).toBeNull();
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
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
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
  });

  it("does not render a dead primary recommendation when no customer-ready action is available", () => {
    const { container } = render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref: "",
        practiceHref: "/practice/number-targeted?learnerId=learner-a",
        assessmentHref: "/assessments/number?learnerId=learner-a",
        autoCheckStatus: "Developing",
        stepTitle: "Compare fractions",
      }),
    );

    expect(container.querySelector('[data-pathway-primary-action="true"]')).toBeNull();
    expect(screen.queryByRole("link", { name: "Check understanding" })).toBeNull();
    expect(screen.queryByRole("link", { name: /Practise/i })).toBeNull();
    expect(screen.queryByRole("link", { name: "Add to Portfolio" })).toBeNull();
  });

  it("keeps English Morphology actions customer-ready without dormant practice, assessment, or fake worksheet links", () => {
    const { container } = render(
      React.createElement(CleanPathwayStepActionRow, {
        captureHref:
          "/my-capture?source=my-pathways&learnerId=learner-a&subjectKey=english&pathwayKey=morphology-and-spelling&stageKey=middle-primary&pathwayStepId=english%3A%3Amorphology-and-spelling%3A%3Amiddle-primary%3A%3Au001-prefix-re&stepKey=u001-prefix-re&returnTo=%2Fmy-pathways%3FsubjectKey%3Denglish%26strandKey%3Dmorphology-and-spelling%26learnerId%3Dlearner-a%23pathway-step-morphology-and-spelling-middle-primary-u001-prefix-re",
        practiceHref: "/practice/number-targeted?learnerId=learner-a",
        assessmentHref: "/assessments/number?learnerId=learner-a",
        stepTitle: "Prefix re-",
        subjectKey: "english",
        strandKey: "morphology-and-spelling",
        stageKey: "middle-primary",
        pathwayStepId: "english::morphology-and-spelling::middle-primary::u001-prefix-re",
        stepKey: "u001-prefix-re",
        worksheetResource: null,
      }),
    );

    expect(screen.queryByRole("link", { name: /Practise/i })).toBeNull();
    expect(screen.queryByRole("link", { name: "Check understanding" })).toBeNull();
    expect(screen.queryByRole("link", { name: "View worksheet" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Download worksheet" })).toBeNull();
    expect(screen.getByRole("link", { name: "Add to Portfolio" })).toBeTruthy();
    expect(container.querySelector('[data-pathway-primary-action="true"]')?.textContent).toBe(
      "Add to Portfolio",
    );
  });
});
