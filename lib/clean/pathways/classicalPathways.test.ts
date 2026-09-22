import { describe, expect, it } from "vitest";
import { MYLEARNA_CLASSICAL_ENCOUNTER_ONE } from "@/lib/clean/curriculum/classicalCurriculumRegistry";
import { CLASSICAL_STRAND_WORKSPACE_BUILDERS } from "@/lib/clean/pathways/classicalPathways";
import { getPathwayStepsByStrand } from "@/lib/clean/pathways/pathwayStepRegistry";

describe("MyLearna Classical pathways", () => {
  it("registers Encounter 1 on the Years 3-4 Ancient World pathway", () => {
    const steps = getPathwayStepsByStrand("classical", "history-and-civilisation");

    expect(steps).toContainEqual(
      expect.objectContaining({
        id: "classical::history-and-civilisation::middle-primary::from-wandering-to-settlement",
        subjectKey: "classical",
        strandKey: "history-and-civilisation",
        stageKey: "middle-primary",
        stepKey: "from-wandering-to-settlement",
        stepTitle: "Encounter 1 · From Wandering to Settlement",
      }),
    );
  });

  it("derives Encounter 1 academic content from the canonical definition", () => {
    const workspace = CLASSICAL_STRAND_WORKSPACE_BUILDERS["history-and-civilisation"]("middle-primary");
    const step = workspace.stages.find((stage) => stage.key === "middle-primary")?.steps[0];
    const canonical = MYLEARNA_CLASSICAL_ENCOUNTER_ONE;

    expect(step).toMatchObject({
      id: canonical.encounterNumber,
      stepKey: canonical.pathway.stepKey,
      meaning: canonical.academic.meaning,
      skillFocus: canonical.academic.skillFocus,
      learningIntention: canonical.academic.learningIntention,
      practiceActivity: canonical.academic.practiceActivity,
      assessmentCheck: canonical.academic.assessmentCheck,
      nextStep: canonical.academic.nextStep,
      reportLanguage: canonical.academic.reportLanguage,
    });
    expect(step?.successCriteria).toEqual(canonical.academic.successCriteria);
    expect(step?.evidenceExamples).toEqual(canonical.academic.evidenceExamples);
  });
});
