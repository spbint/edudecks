import { describe, expect, it } from "vitest";
import { buildEiEvidenceBalanceState } from "@/lib/clean/ei/evidenceBalance";
import { buildEiEventsFromLearnerThread } from "@/lib/clean/ei/learnerThreadAdapter";
import type {
  LearnerThreadFactKindV1,
  LearnerThreadFactV1,
  LearnerThreadReferenceType,
  LearnerThreadV1,
} from "@/lib/clean/learnerThread/types";

const COMPETENCY_ID =
  "mathematics::number-and-place-value::middle-primary::place-value";

function makeFact(input: {
  id: string;
  kind: LearnerThreadFactKindV1;
  sourceType: LearnerThreadReferenceType;
  sourceId: string;
  state?: string | null;
  value?: string | number | boolean | null;
  attributes?: Record<string, string | number | boolean | null>;
}): LearnerThreadFactV1 {
  return {
    recordType: "fact",
    id: input.id,
    kind: input.kind,
    occurredAt: "2026-10-05T01:00:00.000Z",
    recordedAt: "2026-10-05T01:00:00.000Z",
    capabilityReferences: [
      {
        type: "pathway_step",
        id: COMPETENCY_ID,
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
      summary: "Synthetic EI adapter test fact.",
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
      asOf: "2026-10-05T02:00:00.000Z",
      referenceAt: "2026-10-05T01:00:00.000Z",
      ageDays: 0,
      policy: {
        id: "test",
        version: "1",
        staleAfterDays: 90,
      },
    },
  };
}

function makeThread(facts: LearnerThreadFactV1[]): LearnerThreadV1 {
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
    generatedAt: "2026-10-05T02:00:00.000Z",
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

describe("Learner Thread -> EI v1 adapter", () => {
  it("converts a completed auto-checked assessment into an advisory assessment event", () => {
    const events = buildEiEventsFromLearnerThread(
      makeThread([
        makeFact({
          id: "attempt-fact",
          kind: "assessment_attempt_recorded",
          sourceType: "assessment_attempt",
          sourceId: "attempt-1",
          state: "completed",
          value: 10,
          attributes: {
            autoIncorrectCount: 2,
            reviewNeededCount: 0,
          },
        }),
      ]),
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.eventType).toBe("assessment_attempt_completed");
    expect(events[0]?.sourceKind).toBe("assessment");
    expect(events[0]?.competencyId).toBe(COMPETENCY_ID);
    expect(events[0]?.evidenceGroupId).toBe(
      "assessment_attempt:attempt-1",
    );
    expect(events[0]?.signal.polarity).toBe(1);
    expect(events[0]?.signal.strength).toBe("moderate");
  });

  it("does not convert an incomplete assessment into a completed EI assessment event", () => {
    const events = buildEiEventsFromLearnerThread(
      makeThread([
        makeFact({
          id: "attempt-fact",
          kind: "assessment_attempt_recorded",
          sourceType: "assessment_attempt",
          sourceId: "attempt-1",
          state: "in_progress",
          value: 5,
          attributes: {
            autoIncorrectCount: 1,
          },
        }),
      ]),
    );

    expect(events).toEqual([]);
  });

  it("keeps an evidence record and its adult judgement in the same evidence group", () => {
    const events = buildEiEventsFromLearnerThread(
      makeThread([
        makeFact({
          id: "evidence-fact",
          kind: "evidence_recorded",
          sourceType: "evidence_entry",
          sourceId: "evidence-1",
          state: "recorded",
        }),
        makeFact({
          id: "judgement-fact",
          kind: "progress_judgement_recorded",
          sourceType: "evidence_entry",
          sourceId: "evidence-1",
          state: "Secure",
        }),
      ]),
    );

    expect(events).toHaveLength(2);
    expect(new Set(events.map((event) => event.evidenceGroupId)).size).toBe(1);

    const state = buildEiEvidenceBalanceState(events);
    expect(state?.evidenceGroupCount).toBe(1);
    expect(state?.directionalEvidenceGroupCount).toBe(1);
    expect(state?.supportRatio).toBe(1);
    expect(state?.signalBand).toBe("not_enough_evidence");
  });

  it("preserves contradictory independent evidence rather than overwriting it", () => {
    const events = buildEiEventsFromLearnerThread(
      makeThread([
        makeFact({
          id: "secure",
          kind: "assessment_status_recorded",
          sourceType: "assessment_skill_status",
          sourceId: "status-1",
          state: "Secure",
        }),
        makeFact({
          id: "needs-support",
          kind: "progress_judgement_recorded",
          sourceType: "evidence_entry",
          sourceId: "evidence-2",
          state: "Needs support",
        }),
      ]),
    );

    const state = buildEiEvidenceBalanceState(events);

    expect(state?.directionalEvidenceGroupCount).toBe(2);
    expect(state?.supportRatio).toBe(0.5);
    expect(state?.signalBand).toBe("mixed");
    expect(state?.advisoryOnly).toBe(true);
  });

  it("does not force Developing into a positive or negative signal", () => {
    const events = buildEiEventsFromLearnerThread(
      makeThread([
        makeFact({
          id: "developing",
          kind: "progress_judgement_recorded",
          sourceType: "evidence_entry",
          sourceId: "evidence-1",
          state: "Developing",
        }),
      ]),
    );

    expect(events[0]?.signal.polarity).toBe(0);

    const state = buildEiEvidenceBalanceState(events);
    expect(state?.directionalEvidenceGroupCount).toBe(0);
    expect(state?.supportRatio).toBeNull();
  });

  it("ignores planning facts because they are not learning evidence in EI v1", () => {
    const events = buildEiEventsFromLearnerThread(
      makeThread([
        makeFact({
          id: "plan",
          kind: "plan_scheduled",
          sourceType: "calendar_item",
          sourceId: "calendar-1",
          state: "planned",
        }),
      ]),
    );

    expect(events).toEqual([]);
  });
});
