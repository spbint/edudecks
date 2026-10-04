import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AssessmentEvidenceConfirmationCard from "./AssessmentEvidenceConfirmationCard";
import type { NumberOperationsEvidencePreview } from "@/lib/clean/assessments/placement/numberOperationsEvidencePreview";

afterEach(() => cleanup());

const preview: NumberOperationsEvidencePreview = {
  kind: "mylearna-assessment-evidence-preview-v1",
  sourceType: "mylearna_assessment",
  sourceFormId: "number-operations-baseline",
  frameworkId: "MYL-MATH-AU-NUMERACY-V9",
  title: "MyLearna Number & Operations baseline",
  summary: "Assessment evidence across one area.",
  learningArea: "Mathematics",
  assessedSubElements: 1,
  expectedSubElements: 5,
  routingOnlySubElements: 1,
  curriculumNodeIds: [
    "mylearna::mathematics::au-numeracy-v9::counting-processes::p4-p5",
  ],
  resultBands: [
    {
      subElementKey: "counting-processes",
      subElementLabel: "Counting processes",
      bandLabel: "P4–P5",
      confidence: "routing-only",
    },
  ],
  requiresParentConfirmation: true,
  portfolioEligibleAfterConfirmation: true,
  reportEligibleAfterConfirmation: true,
};

describe("AssessmentEvidenceConfirmationCard", () => {
  it("keeps confirmation blocked until the adult explicitly acknowledges the starting-point result", () => {
    render(React.createElement(AssessmentEvidenceConfirmationCard, { preview }));

    const button = screen.getByRole("button", {
      name: "Preview confirmed evidence",
    });
    expect(button).toBeDisabled();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I understand this is a starting-point assessment result/i,
      }),
    );
    expect(button).not.toBeDisabled();

    fireEvent.click(button);
    expect(
      screen.getByText("Confirmation ready for the persistence boundary"),
    ).toBeTruthy();
    expect(
      screen.getByText(/No learner, family, Portfolio, report or pathway data has been written/i),
    ).toBeTruthy();
  });
});


it("reports only the parent's Portfolio/report choices when confirmation is previewed", () => {
  const choices: Array<{ includeInPortfolio: boolean; includeInReport: boolean }> = [];
  render(
    React.createElement(AssessmentEvidenceConfirmationCard, {
      preview,
      onConfirmationPreviewed: (value) => choices.push(value),
    }),
  );

  fireEvent.click(
    screen.getByRole("checkbox", {
      name: /I understand this is a starting-point assessment result/i,
    }),
  );
  expect(
    screen.getByRole("checkbox", { name: "Make available for reports" }),
  ).not.toBeChecked();
  fireEvent.click(
    screen.getByRole("button", { name: "Preview confirmed evidence" }),
  );

  expect(choices).toEqual([
    { includeInPortfolio: true, includeInReport: false },
  ]);
});


it("uses parent language without exposing persistence/debug terminology", () => {
  render(
    React.createElement(AssessmentEvidenceConfirmationCard, {
      preview,
      presentation: "parent",
    }),
  );

  expect(screen.getByText("Learning evidence")).toBeTruthy();
  expect(
    screen.getByText(
      "I understand this is a starting point, not a grade or permanent level.",
    ),
  ).toBeTruthy();
  expect(screen.queryByText("Parent confirmation prototype")).toBeNull();
  expect(screen.queryByText(/persistence boundary/i)).toBeNull();

  fireEvent.click(
    screen.getByRole("checkbox", {
      name: /I understand this is a starting point/i,
    }),
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Preview this evidence choice" }),
  );

  expect(screen.getByText("Evidence choice previewed")).toBeTruthy();
  expect(
    screen.getByText(/Nothing has been saved in this staff preview/i),
  ).toBeTruthy();
  expect(screen.queryByText("View confirmation payload")).toBeNull();
});


it("makes formal report inclusion an explicit opt-in", () => {
  render(
    React.createElement(AssessmentEvidenceConfirmationCard, {
      preview,
      presentation: "parent",
    }),
  );

  expect(
    screen.getByRole("checkbox", { name: "Include in My Portfolio" }),
  ).toBeChecked();
  expect(
    screen.getByRole("checkbox", { name: "Make available for reports" }),
  ).not.toBeChecked();
});


it("does not offer evidence confirmation when the electronic check produced no reportable areas", () => {
  const emptyPreview: NumberOperationsEvidencePreview = {
    ...preview,
    assessedSubElements: 0,
    routingOnlySubElements: 0,
    curriculumNodeIds: [],
    resultBands: [],
    portfolioEligibleAfterConfirmation: false,
    reportEligibleAfterConfirmation: false,
  };

  render(
    React.createElement(AssessmentEvidenceConfirmationCard, {
      preview: emptyPreview,
      presentation: "parent",
    }),
  );

  expect(screen.getByText("Practical evidence comes next")).toBeTruthy();
  expect(
    screen.queryByRole("button", { name: "Preview this evidence choice" }),
  ).toBeNull();
  expect(
    screen.queryByRole("checkbox", { name: "Include in My Portfolio" }),
  ).toBeNull();
});
