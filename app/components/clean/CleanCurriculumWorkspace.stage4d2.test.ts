// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CleanProgressObservationsPanel,
} from "@/app/components/clean/CleanCurriculumWorkspace";
import type {
  RecognizedProgressJudgementObservation,
} from "@/lib/clean/pathways/pathwayStepState";

const source = readFileSync(
  join(process.cwd(), "app/components/clean/CleanCurriculumWorkspace.tsx"),
  "utf8",
);
const myDataRouteSource = readFileSync(
  join(process.cwd(), "app/(auth)/my-data/page.tsx"),
  "utf8",
);

function observation(
  partial: Partial<RecognizedProgressJudgementObservation>,
): RecognizedProgressJudgementObservation {
  return {
    id: partial.id ?? "learner-1::step-1::Consolidating::2026-07-15",
    learnerId: partial.learnerId ?? "learner-1",
    sourceType: partial.sourceType ?? "evidence",
    sourceId: partial.sourceId ?? "evidence-1",
    pathwayStepId: partial.pathwayStepId ?? "step-1",
    subjectTitle: partial.subjectTitle ?? "Mathematics",
    strandTitle: partial.strandTitle ?? "Number",
    stepTitle: partial.stepTitle ?? "Count, compare, and explain",
    judgement: partial.judgement ?? "Consolidating",
    dateValue: partial.dateValue ?? "2026-07-15",
    sortValue: partial.sortValue ?? Date.parse("2026-07-15T00:00:00"),
  };
}

describe("CleanCurriculumWorkspace Stage 4D.2 active progress observations", () => {
  it("keeps the active My Data route wired to the updated workspace component", () => {
    expect(myDataRouteSource).toContain("CleanCurriculumWorkspace");
    expect(myDataRouteSource).toContain("return <CleanCurriculumWorkspace />");
  });

  it("renders saved progress judgements from the shared observation model", () => {
    render(
      React.createElement(CleanProgressObservationsPanel, {
        entriesLoading: false,
        observations: [
          observation({
            id: "latest",
            judgement: "Consolidating",
            dateValue: "2026-07-15",
            sortValue: Date.parse("2026-07-15T00:00:00"),
          }),
          observation({
            id: "previous",
            judgement: "Secure",
            dateValue: "2026-07-14",
            sortValue: Date.parse("2026-07-14T00:00:00"),
          }),
        ],
      }),
    );

    expect(screen.getByText("2 progress judgements saved")).toBeTruthy();
    expect(screen.getByText(/Latest: Consolidating/)).toBeTruthy();
    expect(screen.getByText("Consolidating")).toBeTruthy();
    expect(screen.getByText("Secure")).toBeTruthy();
    expect(screen.queryByText("No progress judgement has been saved yet.")).toBeNull();
    expect(screen.queryByText("No progress judgement saved yet")).toBeNull();
  });

  it("shows the corrected empty state only when the shared model has no observations", () => {
    render(
      React.createElement(CleanProgressObservationsPanel, {
        entriesLoading: false,
        observations: [],
      }),
    );

    expect(screen.getByText("No progress judgement has been saved yet.")).toBeTruthy();
    expect(screen.queryByText("No progress judgement saved yet")).toBeNull();
  });

  it("replaces the unclear support-area evidence metric with parent-facing evidence labels", () => {
    expect(source).not.toContain("support areas with evidence");
    expect(source).toContain("learning areas");
    expect(source).toContain("with evidence");
    expect(source).toContain("learning records");
    expect(source).toContain("progress judgements");
  });

  it("uses the shared observations helper and has no duplicate old progress panel branch", () => {
    expect(source).toContain("buildRecognizedProgressJudgementObservations");
    expect(source).toContain("CleanProgressObservationsPanel");
    expect(source).not.toContain("assessmentEvidenceEvents");
    expect(source).not.toContain("No progress judgement saved yet");
    expect(source.match(/Progress observations/g) ?? []).toHaveLength(1);
  });
});
