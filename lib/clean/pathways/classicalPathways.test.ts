import { describe, expect, it } from "vitest";
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
});
