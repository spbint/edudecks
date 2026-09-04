import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildParentProgressStatusInput,
  evidenceProgressToParentStatus,
  parentProgressToStoredStatus,
  storedProgressToParentStatus,
  toParentProgressStatus,
} from "@/lib/clean/pathways/parentProgress";
import { buildUnifiedPathwayStepStateIndex } from "@/lib/clean/pathways/pathwayStepState";

describe("parent-confirmed pathway progress", () => {
  it.each([
    ["Not checked yet", "Not assessed yet"],
    ["Needs support", "Still developing"],
    ["Developing", "Developing"],
    ["Consolidating", "Secure"],
    ["Secure", "Strong"],
  ] as const)("maps %s to the existing stored status %s", (parent, stored) => {
    expect(parentProgressToStoredStatus(parent)).toBe(stored);
  });

  it.each([
    ["Not assessed yet", "Not checked yet"],
    ["Still developing", "Needs support"],
    ["Developing", "Developing"],
    ["Secure", "Consolidating"],
    ["Strong", "Secure"],
  ] as const)("maps stored %s to the parent-facing status %s", (stored, parent) => {
    expect(storedProgressToParentStatus(stored)).toBe(parent);
  });

  it("builds a step-safe upsert payload using the canonical pathway ID as skillKey", () => {
    expect(
      buildParentProgressStatusInput({
        learnerId: "learner-1",
        subjectKey: "mathematics",
        pathwayStepId:
          "mathematics::ratio-and-proportional-reasoning::middle-primary::use-simple-rates-in-practical-contexts",
        stageKey: "middle-primary",
        strandKey: "ratio-and-proportional-reasoning",
        stepKey: "use-simple-rates-in-practical-contexts",
        status: "Consolidating",
      }),
    ).toEqual({
      learnerId: "learner-1",
      subjectKey: "mathematics",
      skillKey:
        "mathematics::ratio-and-proportional-reasoning::middle-primary::use-simple-rates-in-practical-contexts",
      stageKey: "middle-primary",
      status: "Secure",
      note: null,
      pathwayStepId:
        "mathematics::ratio-and-proportional-reasoning::middle-primary::use-simple-rates-in-practical-contexts",
      strandKey: "ratio-and-proportional-reasoning",
      stepKey: "use-simple-rates-in-practical-contexts",
    });
  });

  it("maps evidence suggestions without treating them as persisted confirmation", () => {
    expect(evidenceProgressToParentStatus("Developing")).toBe("Developing");
    expect(evidenceProgressToParentStatus("Progress level: Secure")).toBeNull();
    expect(evidenceProgressToParentStatus("Goal achieved")).toBe("Secure");
  });

  it.each([
    [null, "Not checked yet"],
    ["Not started", "Not checked yet"],
    ["Still developing", "Needs support"],
    ["Working towards", "Developing"],
    ["Practising", "Developing"],
    ["Evidence started", "Developing"],
    ["Ready to assess", "Consolidating"],
    ["Strong", "Secure"],
    ["Goal achieved", "Secure"],
    ["Goal achieved + extension", "Secure"],
  ] as const)("maps the raw pathway signal %s to %s for presentation", (raw, parent) => {
    expect(toParentProgressStatus(raw)).toBe(parent);
  });

  it("keeps unknown evidence text out of the presentation vocabulary", () => {
    expect(toParentProgressStatus("Progress level: Secure")).toBeNull();
  });

  it("keeps legacy pathway wording behind the canonical presentation mapper", () => {
    const source = readFileSync(
      join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
      "utf8",
    );

    expect(source).toContain('toParentProgressStatus(label, "evidence")');
    expect(source).toContain("return toParentProgressStatus(status) || \"Not checked yet\"");
    expect(source).not.toContain('return "Ready for evidence"');
    expect(source).not.toContain('return "In progress"');
  });

  it("leaves the existing manual Pathways selection handlers in place", () => {
    const source = readFileSync(
      join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
      "utf8",
    );

    expect(source).toContain("function handleSelectWorkspaceStage");
    expect(source).toContain("onActiveStageChange={handleSelectWorkspaceStage}");
    expect(source).toContain("function handleSelectSubjectStrand");
    expect(source).toContain("onManualCompletionChange={onManualCompletionChange}");
    expect(source).toContain("isOpen && registryStep");
  });

  it("uses the canonical registry identity and refreshes unified state after save", () => {
    const source = readFileSync(
      join(process.cwd(), "app/components/clean/CleanPathwaysWorkspace.tsx"),
      "utf8",
    );

    expect(source).toContain("item.id === canonicalPathwayStepId");
    expect(source).toContain("subjectKey={registryStep.subjectKey}");
    expect(source).toContain("stageKey={registryStep.stageKey as CleanAssessmentStageKey}");
    expect(source).toContain("strandKey={registryStep.strandKey}");
    expect(source).toContain("stepKey={registryStep.stepKey}");
    expect(source).toContain("pathwayStepId={registryStep.id}");
    expect(source).toContain("function handlePathwayProgressSaved()");
    expect(source).toContain("void reloadUnifiedPathwayStepState()");
  });

  it("keeps confirmed statuses isolated by canonical pathway step", () => {
    const firstStep =
      "mathematics::ratio-and-proportional-reasoning::middle-primary::use-tables-or-diagrams-to-compare-related-quantities";
    const secondStep =
      "mathematics::ratio-and-proportional-reasoning::middle-primary::use-simple-rates-in-practical-contexts";
    const index = buildUnifiedPathwayStepStateIndex({
      assessmentStatuses: [
        {
          id: "status-a",
          familyId: "family-1",
          learnerId: "learner-1",
          subjectKey: "mathematics",
          skillKey: firstStep,
          stageKey: "middle-primary",
          status: "Strong",
          note: null,
          createdByUserId: "user-1",
          createdAt: "2026-08-13T00:00:00.000Z",
          updatedAt: "2026-08-13T00:00:00.000Z",
          pathwayStepId: firstStep,
          strandKey: "ratio-and-proportional-reasoning",
          stepKey: "use-tables-or-diagrams-to-compare-related-quantities",
        },
        {
          id: "status-b",
          familyId: "family-1",
          learnerId: "learner-1",
          subjectKey: "mathematics",
          skillKey: secondStep,
          stageKey: "middle-primary",
          status: "Still developing",
          note: null,
          createdByUserId: "user-1",
          createdAt: "2026-08-13T00:00:00.000Z",
          updatedAt: "2026-08-13T00:00:00.000Z",
          pathwayStepId: secondStep,
          strandKey: "ratio-and-proportional-reasoning",
          stepKey: "use-simple-rates-in-practical-contexts",
        },
      ],
    });

    expect(index.get(firstStep)?.assessmentConfidence).toBe("Strong");
    expect(index.get(secondStep)?.assessmentConfidence).toBe("Still developing");
  });
});
