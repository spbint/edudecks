import { describe, expect, it } from "vitest";
import { buildEiEvidenceBalanceState } from "@/lib/clean/ei/evidenceBalance";
import type { EiLearningEvent } from "@/lib/clean/ei/types";

function makeEvent(
  overrides: Partial<EiLearningEvent> & {
    id: string;
    evidenceGroupId: string;
  },
): EiLearningEvent {
  return {
    id: overrides.id,
    product: overrides.product ?? "homeschool",
    tenantKind: overrides.tenantKind ?? "family",
    tenantId: overrides.tenantId ?? "family-1",
    learnerId: overrides.learnerId ?? "learner-1",
    competencyId:
      overrides.competencyId ?? "mathematics::number::step-1",
    eventType: overrides.eventType ?? "assessment_response",
    sourceKind: overrides.sourceKind ?? "assessment",
    sourceId: overrides.sourceId ?? "assessment-attempt-1",
    evidenceGroupId: overrides.evidenceGroupId,
    occurredAt:
      overrides.occurredAt ?? "2026-10-05T01:00:00.000Z",
    signal: overrides.signal ?? {
      polarity: 1,
      strength: "high",
    },
    provenance: overrides.provenance ?? {
      originType: "assessment_attempt_response",
      originTable: "assessment_attempt_responses",
      originRecordId: overrides.id,
      adapterVersion: "ei-homeschool-v1",
    },
    metadata: overrides.metadata,
  };
}

describe("EI v1 evidence balance", () => {
  it("keeps one assessment session as one evidence group", () => {
    const result = buildEiEvidenceBalanceState([
      makeEvent({ id: "r1", evidenceGroupId: "attempt-1" }),
      makeEvent({ id: "r2", evidenceGroupId: "attempt-1" }),
      makeEvent({ id: "r3", evidenceGroupId: "attempt-1" }),
    ]);

    expect(result).not.toBeNull();
    expect(result?.eventCount).toBe(3);
    expect(result?.evidenceGroupCount).toBe(1);
    expect(result?.directionalEvidenceGroupCount).toBe(1);
    expect(result?.signalBand).toBe("not_enough_evidence");
    expect(result?.advisoryOnly).toBe(true);
  });

  it("treats corroborated positive evidence as a strong signal without making it a formal judgement", () => {
    const result = buildEiEvidenceBalanceState([
      makeEvent({
        id: "assessment-1",
        evidenceGroupId: "attempt-1",
        sourceKind: "assessment",
      }),
      makeEvent({
        id: "evidence-1",
        evidenceGroupId: "evidence-entry-1",
        sourceKind: "evidence_capture",
        eventType: "evidence_observation",
      }),
      makeEvent({
        id: "judgement-1",
        evidenceGroupId: "adult-judgement-1",
        sourceKind: "adult_judgement",
        eventType: "adult_judgement",
      }),
    ]);

    expect(result?.evidenceGroupCount).toBe(3);
    expect(result?.directionalEvidenceGroupCount).toBe(3);
    expect(result?.sourceKindCount).toBe(3);
    expect(result?.directionalSourceKindCount).toBe(3);
    expect(result?.confidence).toBe("high");
    expect(result?.signalBand).toBe("strong_signal");
    expect(result?.supportRatio).toBe(1);
    expect(result?.advisoryOnly).toBe(true);
  });

  it("surfaces mixed evidence instead of averaging it into false certainty", () => {
    const result = buildEiEvidenceBalanceState([
      makeEvent({
        id: "positive",
        evidenceGroupId: "attempt-1",
        signal: { polarity: 1, strength: "high" },
      }),
      makeEvent({
        id: "negative",
        evidenceGroupId: "evidence-entry-1",
        sourceKind: "evidence_capture",
        eventType: "evidence_observation",
        signal: { polarity: -1, strength: "high" },
      }),
    ]);

    expect(result?.supportRatio).toBe(0.5);
    expect(result?.signalBand).toBe("mixed");
    expect(result?.confidence).toBe("moderate");
  });

  it("does not turn bare evidence existence into directional evidence", () => {
    const result = buildEiEvidenceBalanceState([
      makeEvent({
        id: "evidence-1",
        evidenceGroupId: "evidence-entry-1",
        sourceKind: "evidence_capture",
        eventType: "evidence_observation",
        signal: { polarity: 0, strength: "low" },
      }),
      makeEvent({
        id: "evidence-2",
        evidenceGroupId: "evidence-entry-2",
        sourceKind: "evidence_capture",
        eventType: "evidence_observation",
        signal: { polarity: 0, strength: "low" },
      }),
    ]);

    expect(result?.evidenceGroupCount).toBe(2);
    expect(result?.directionalEvidenceGroupCount).toBe(0);
    expect(result?.supportRatio).toBeNull();
    expect(result?.signalBand).toBe("not_enough_evidence");
    expect(result?.confidence).toBe("low");
  });

  it("ignores events for another learner or competency in the same input array", () => {
    const result = buildEiEvidenceBalanceState([
      makeEvent({ id: "base", evidenceGroupId: "attempt-1" }),
      makeEvent({
        id: "other-learner",
        evidenceGroupId: "attempt-2",
        learnerId: "learner-2",
      }),
      makeEvent({
        id: "other-skill",
        evidenceGroupId: "attempt-3",
        competencyId: "mathematics::number::step-2",
      }),
    ]);

    expect(result?.eventCount).toBe(1);
    expect(result?.evidenceGroupCount).toBe(1);
    expect(result?.signalBand).toBe("not_enough_evidence");
  });
});
