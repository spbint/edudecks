// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { mapAssessmentSkillStatusRow } from "@/lib/clean/assessments/client";
import { mapAssessmentAttemptRow } from "@/lib/clean/assessments/attemptClient";
import { CurrentLearningCard } from "@/app/components/clean/CleanMyLearnaWorkspace";
import { buildUnifiedPathwayStepStateIndex } from "@/lib/clean/pathways/pathwayStepState";
import { getPathwayStepById } from "@/lib/clean/pathways/pathwayStepRegistry";

describe("My Learna current learning live-data wiring", () => {
  afterEach(() => cleanup());

  it("renders the exact live canonical parent confirmation instead of the empty state", () => {
    const pathwayStepId = "mathematics::number-and-place-value::middle-primary::estimate-and-check-reasonableness";
    const registryItem = getPathwayStepById(
      "mathematics",
      "number-and-place-value",
      "middle-primary",
      "estimate-and-check-reasonableness",
    );
    expect(registryItem).not.toBeNull();

    const status = mapAssessmentSkillStatusRow({
      id: "live-status",
      family_id: "family-james",
      learner_id: "learner-james",
      subject_key: "mathematics",
      strand_key: "number-and-place-value",
      stage_key: "middle-primary",
      pathway_step_id: pathwayStepId,
      step_key: "estimate-and-check-reasonableness",
      skill_key: pathwayStepId,
      status: "Developing",
      note: null,
      created_by_user_id: "parent-james",
      created_at: "2026-08-14T09:00:00.000Z",
      updated_at: "2026-08-14T09:00:00.000Z",
    });
    const stepIndex = buildUnifiedPathwayStepStateIndex({ assessmentStatuses: [status] });
    const step = registryItem!;

    render(
      <CurrentLearningCard
        step={{
          key: step.id,
          subjectKey: step.subjectKey,
          subjectTitle: step.subjectTitle,
          strandKey: step.strandKey,
          strandTitle: step.strandTitle,
          stageKey: step.stageKey,
          stageTitle: step.stageTitle,
          pathwayStepId: step.id,
          stepTitle: step.stepTitle,
          stepDescription: step.stepDescription,
          reason: "parent-confirmation",
          href: "/my-learna",
        }}
        stepIndex={stepIndex}
        attempts={[]}
        learnerId="learner-james"
        familyId="family-james"
        onProgressSaved={() => undefined}
      />,
    );

    expect(screen.getByText("Estimate and check reasonableness")).toBeTruthy();
    expect(screen.getByText("Developing")).toBeTruthy();
    expect(screen.getByText(/Confirmed by you/)).toBeTruthy();
    expect(screen.queryByText("Start building James's learning story")).toBeNull();
  });

  it("keeps an exact live completed check factual when it is the only current-learning signal", () => {
    const pathwayStepId = "mathematics::number-and-place-value::middle-primary::recall-and-apply-multiplication-facts";
    const registryItem = getPathwayStepById(
      "mathematics",
      "number-and-place-value",
      "middle-primary",
      "recall-and-apply-multiplication-facts",
    );
    expect(registryItem).not.toBeNull();
    const attempt = mapAssessmentAttemptRow({
      id: "live-attempt",
      family_id: "family-james",
      learner_id: "learner-james",
      subject_key: "mathematics",
      strand_key: "number-and-place-value",
      stage_key: "middle-primary",
      pathway_step_id: pathwayStepId,
      step_key: "recall-and-apply-multiplication-facts",
      progression_band_key: null,
      item_bank_key: "multiplication-facts",
      mode: "mini_check",
      source_route: null,
      status: "completed",
      item_count: 5,
      attempted_count: 5,
      auto_correct_count: 4,
      auto_incorrect_count: 1,
      review_needed_count: 0,
      summary_snapshot: {},
      started_at: "2026-08-15T09:00:00.000Z",
      completed_at: "2026-08-15T09:05:00.000Z",
      created_by_user_id: "parent-james",
      created_at: "2026-08-15T09:00:00.000Z",
      updated_at: "2026-08-15T09:05:00.000Z",
    });
    const step = registryItem!;

    render(
      <CurrentLearningCard
        step={{ key: step.id, subjectKey: step.subjectKey, subjectTitle: step.subjectTitle, strandKey: step.strandKey, strandTitle: step.strandTitle, stageKey: step.stageKey, stageTitle: step.stageTitle, pathwayStepId: step.id, stepTitle: step.stepTitle, stepDescription: step.stepDescription, reason: "completed-check", href: "/my-learna" }}
        stepIndex={buildUnifiedPathwayStepStateIndex({})}
        attempts={[attempt]}
        learnerId="learner-james"
        familyId="family-james"
        onProgressSaved={() => undefined}
      />,
    );

    expect(screen.getByText("Not checked yet")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Why this is shown" }));
    expect(screen.getByText(/Latest check: 4 of 5 correct/)).toBeTruthy();
  });
});
