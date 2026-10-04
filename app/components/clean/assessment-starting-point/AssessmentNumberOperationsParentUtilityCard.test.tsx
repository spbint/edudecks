import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
  recheckPlan: {
    subElementKey: "number-place-value",
    trigger: "after-practice",
    headline: "Recheck after a short run of successful practice",
    guidance: "Use fresh items after the learner is starting to use the idea independently.",
    evidenceToLookFor: ["independent place-value use"],
    minimumFreshEvidence: 2,
    repeatSameItemsImmediately: false,
  },
};

const utility: NumberOperationsParentUtility = {
  title: "A clear starting point for what to do next",
  summary: "A useful starting point across five areas.",
  assessedAreas: 5,
  expectedAreas: 5,
  complete: true,
  startHere: area,
  areas: [area],
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
    expect(
      screen.getByText("Recheck after a short run of successful practice"),
    ).toBeTruthy();
    expect(
      screen.getAllByText("Ready to build on the next step"),
    ).toHaveLength(1);
  });
});


it("reports whether the parent chose practice or My Pathways", () => {
  const selected: Array<[string, string]> = [];
  render(
    React.createElement(AssessmentNumberOperationsParentUtilityCard, {
      utility,
      onActionSelected: (area, destination) =>
        selected.push([area, destination]),
    }),
  );

  fireEvent.click(
    screen.getByRole("link", { name: "Practise place value and operations" }),
  );
  fireEvent.click(
    screen.getByRole("link", {
      name: "Open Number and place value in My Pathways",
    }),
  );

  expect(selected).toEqual([
    ["number-place-value", "practice"],
    ["number-place-value", "my_pathways"],
  ]);
});


it("classifies a Pathways fallback primary action as My Pathways, not practice", () => {
  const selected: Array<[string, string]> = [];
  const fallbackArea: NumberOperationsParentUtility["areas"][number] = {
    ...area,
    subElementKey: "counting-processes",
    label: "Counting processes",
    actionLabel: "Review Number and place value in My Pathways",
    actionHref:
      "/my-pathways?subjectKey=mathematics&strandKey=number-and-place-value",
    pathwaysLabel: "Open Number and place value in My Pathways",
    pathwaysHref:
      "/my-pathways?subjectKey=mathematics&strandKey=number-and-place-value",
    recheckPlan: {
      ...area.recheckPlan,
      subElementKey: "counting-processes",
    },
  };
  const fallbackUtility: NumberOperationsParentUtility = {
    ...utility,
    startHere: fallbackArea,
    areas: [fallbackArea],
  };

  render(
    React.createElement(AssessmentNumberOperationsParentUtilityCard, {
      utility: fallbackUtility,
      onActionSelected: (subElementKey, destination) =>
        selected.push([subElementKey, destination]),
    }),
  );

  fireEvent.click(
    screen.getByRole("link", {
      name: "Review Number and place value in My Pathways",
    }),
  );

  expect(selected).toEqual([
    ["counting-processes", "my_pathways"],
  ]);
});
