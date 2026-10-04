import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AssessmentNumberOperationsParentUtilityCard from "./AssessmentNumberOperationsParentUtilityCard";
import type { NumberOperationsParentUtility } from "@/lib/clean/assessments/placement/numberOperationsParentUtility";

afterEach(() => cleanup());

const area: NumberOperationsParentUtility["areas"][number] = {
  subElementKey: "number-place-value",
  label: "Number and place value",
  state: "build-next",
  headline: "Ready to build on the next step",
  explanation: "The learner can use current place-value ideas and is ready to build.",
  curriculumContext: "Curriculum context: Years 3–4",
  actionLabel: "Practise place value and operations",
  actionHref: "/practice/number-targeted?moduleId=test",
  actionNote: "Broad family match.",
  pathwaysLabel: "Open Number and place value in My Pathways",
  pathwaysHref:
    "/my-pathways?subjectKey=mathematics&strandKey=number-and-place-value",
  pathwaysNote: "Strand-level handoff only.",
  recheckRecommended: true,
  technicalBand: "P5–P6",
  confidenceNote: "Starting-point evidence.",
};

const utility: NumberOperationsParentUtility = {
  title: "A clear starting point for what to do next",
  summary: "A useful starting point across five areas.",
  assessedAreas: 5,
  expectedAreas: 5,
  complete: true,
  startHere: area,
  areas: [],
  trustNote:
    "This is a starting-point profile, not a grade, score, diagnosis or single maths level.",
};

describe("AssessmentNumberOperationsParentUtilityCard", () => {
  it("leads with actionable learning and Pathways links instead of a technical placement label", () => {
    render(
      React.createElement(AssessmentNumberOperationsParentUtilityCard, {
        utility,
      }),
    );

    expect(
      screen.getByText("A clear starting point for what to do next"),
    ).toBeTruthy();
    expect(screen.getByText("Start here")).toBeTruthy();
    expect(screen.getByText("Ready to build on the next step")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Practise place value and operations" }),
    ).toHaveAttribute("href", "/practice/number-targeted?moduleId=test");
    expect(
      screen.getByRole("link", {
        name: "Open Number and place value in My Pathways",
      }),
    ).toHaveAttribute(
      "href",
      "/my-pathways?subjectKey=mathematics&strandKey=number-and-place-value",
    );
    expect(screen.queryByText("P5–P6")).toBeNull();
  });
});
