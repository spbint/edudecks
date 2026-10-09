import { describe, expect, it } from "vitest";
import { buildEiCompetencyReadModel } from "@/lib/clean/ei/readModel";
import type {
  LearnerThreadFactKindV1,
  LearnerThreadFactV1,
  LearnerThreadReferenceType,
  LearnerThreadV1,
} from "@/lib/clean/learnerThread/types";

const STEP_A =
  "mathematics::number-and-place-value::middle-primary::place-value";
const STEP_B =
  "mathematics::number-and-place-value::middle-primary::rounding";

function fact(input: {
  id: string;
  kind: LearnerThreadFactKindV1;
  sourceType: LearnerThreadReferenceType;
  sourceId: string;
  competencyId?: string;
  state?: string;
  value?: number;
  attributes?: Record<string, string | number | boolean | null>;
  occurredAt?: string;
}): LearnerThreadFactV1 {
  return {
    recordType: "fact",
    id: input.id,
    kind: input.kind,
    occurredAt:
      input.occurredAt ?? "2026-10-05T01:00:00.000Z",
    recordedAt:
      input.occurredAt ?? "2026-10-05T01:00:00.000Z",
    capabilityReferences: [
      {
        type: "pathway_step",
        id: input.competencyId ?? STEP_A,
      },
    ],
    planActionReferences: [],
    evidenceReferences: [],
    explicitValue: {
      state: input.state ?? null,
      value: input.value ?? null,
      unit: null,
      attributes: input.attributes ?? {},
    },
    provenance: {
      summary: "Synthetic read-model fixture.",
      sourceRecord: {
        type: input.sourceType,
        id: input.sourceId,
      },
      sourceReferences: [
        {
          type: input.sourceType,
          id: input.sourceId,
        },
      ],
      actorType: "account_user",
      actorReference: {
        type: "user",
        id: "user-1",
      },
      sourceTypes: ["parent_entered"],
    },
    confidence: {
      dataSufficiency: "sufficient",
      reason: "Synthetic test fixture.",
    },
    freshness: {
      status: "current",
      asOf: "2026-10-05T03:00:00.000Z",
      referenceAt:
        input.occurredAt ?? "2026-10-05T01:00:00.000Z",
      ageDays: 0,
      policy: {
        id: "test",
        version: "1",
        staleAfterDays: 90,
      },
    },
  };
}

function thread(facts: LearnerThreadFactV1[]): LearnerThreadV1 {
  return {
    schemaVersion: "1.0",
    product: "mylearna-homeschool",
    tenant: {
      type: "family",
      id: "family-1",
    },
    learner: {
      type: "learner",
      id: "learner-1",
    },
    generatedAt: "2026-10-05T03:00:00.000Z",
    freshnessPolicy: {
      id: "test",
      version: "1",
      staleAfterDays: 90,
    },
    facts,
    derivedClaims: [],
    nextStep: null,
  };
}

describe("EI competency read model", () => {
  it("returns only the requested competency", () => {
    const model = buildEiCompetencyReadModel(
      thread([
        fact({
          id: "a",
          kind: "assessment_status_recorded",
          sourceType: "assessment_skill_status",
          sourceId: "status-a",
          state: "Secure",
          competencyId: STEP_A,
        }),
        fact({
          id: "b",
          kind: "assessment_status_recorded",
          sourceType: "assessment_skill_status",
          sourceId: "status-b",
          state: "Needs support",
          competencyId: STEP_B,
        }),
      ]),
      STEP_A,
    );

    expect(model.competencyId).toBe(STEP_A);
    expect(model.events).toHaveLength(1);
    expect(model.events[0]?.competencyId).toBe(STEP_A);
  });

  it("makes contradictions explicit in the read model", () => {
    const model = buildEiCompetencyReadModel(
      thread([
        fact({
          id: "secure",
          kind: "assessment_status_recorded",
          sourceType: "assessment_skill_status",
          sourceId: "status-1",
          state: "Secure",
          occurredAt: "2026-10-01T01:00:00.000Z",
        }),
        fact({
          id: "needs-support",
          kind: "progress_judgement_recorded",
          sourceType: "evidence_entry",
          sourceId: "evidence-1",
          state: "Needs support",
          occurredAt: "2026-10-04T01:00:00.000Z",
        }),
      ]),
      STEP_A,
    );

    expect(model.evidenceGroups).toHaveLength(2);
    expect(model.state?.signalBand).toBe("mixed");
    expect(model.hasContradiction).toBe(true);
  });

  it("does not double-count evidence plus its judgement as two evidence groups", () => {
    const model = buildEiCompetencyReadModel(
      thread([
        fact({
          id: "evidence",
          kind: "evidence_recorded",
          sourceType: "evidence_entry",
          sourceId: "evidence-1",
          state: "recorded",
        }),
        fact({
          id: "judgement",
          kind: "progress_judgement_recorded",
          sourceType: "evidence_entry",
          sourceId: "evidence-1",
          state: "Secure",
        }),
      ]),
      STEP_A,
    );

    expect(model.events).toHaveLength(2);
    expect(model.evidenceGroups).toHaveLength(1);
    expect(model.evidenceGroups[0]?.eventCount).toBe(2);
    expect(model.evidenceGroups[0]?.directionalEventCount).toBe(1);
    expect(model.state?.evidenceGroupCount).toBe(1);
  });

  it("returns a safe empty state when the learner has no EI evidence for the competency", () => {
    const model = buildEiCompetencyReadModel(thread([]), STEP_A);

    expect(model.events).toEqual([]);
    expect(model.evidenceGroups).toEqual([]);
    expect(model.state).toBeNull();
    expect(model.hasContradiction).toBe(false);
  });
});
