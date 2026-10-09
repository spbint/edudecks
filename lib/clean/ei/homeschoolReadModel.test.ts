import { describe, expect, it } from "vitest";
import type { CleanAssessmentSkillStatus } from "@/lib/clean/assessments/types";
import { buildHomeschoolEiCompetencyReadModel } from "@/lib/clean/ei/homeschoolReadModel";
import type { Learner } from "@/lib/clean/learners/types";

const STEP_ID =
  "mathematics::number-and-place-value::middle-primary::place-value";

const learner: Learner = {
  id: "learner-1",
  familyId: "family-1",
  firstName: "Alex",
  preferredName: null,
  surname: null,
  yearLevel: "4",
  notes: null,
  createdByUserId: "user-1",
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const secureStatus: CleanAssessmentSkillStatus = {
  id: "status-1",
  familyId: "family-1",
  learnerId: "learner-1",
  subjectKey: "mathematics",
  skillKey: STEP_ID,
  stageKey: "middle-primary",
  status: "Secure",
  note: null,
  createdByUserId: "user-1",
  createdAt: "2026-10-04T01:00:00.000Z",
  updatedAt: "2026-10-04T01:00:00.000Z",
  pathwayStepId: STEP_ID,
  strandKey: "number-and-place-value",
  stepKey: "place-value",
};

describe("Homeschool EI competency read model", () => {
  it("composes the real Homeschool Learner Thread adapter with EI without writing state", () => {
    const model = buildHomeschoolEiCompetencyReadModel({
      learner,
      assessmentSkillStatuses: [secureStatus],
      asOf: "2026-10-05T00:00:00.000Z",
      freshnessPolicy: {
        id: "ei-test",
        version: "1",
        staleAfterDays: 90,
      },
      competencyId: STEP_ID,
    });

    expect(model.product).toBe("homeschool");
    expect(model.tenantKind).toBe("family");
    expect(model.tenantId).toBe("family-1");
    expect(model.learnerId).toBe("learner-1");
    expect(model.events).toHaveLength(1);
    expect(model.events[0]?.sourceKind).toBe("adult_judgement");
    expect(model.events[0]?.signal.polarity).toBe(1);
    expect(model.state?.directionalEvidenceGroupCount).toBe(1);
    expect(model.state?.signalBand).toBe("not_enough_evidence");
    expect(model.state?.advisoryOnly).toBe(true);
  });
});
