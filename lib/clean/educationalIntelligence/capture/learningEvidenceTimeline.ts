import type { LearningEvidenceResultV1 } from "../learningEvidenceResult";
import type {
  CapturedEvidenceConstructLinkV1,
  CapturedLearningEvidenceSourceType,
  CapturedLearningEvidenceV1,
} from "./capturedLearningEvidence";

export type LearningEvidenceTimelineEventV1 = {
  id: string;
  learnerId: string;
  constructId: string;
  continuumId: string | null;
  occurredAt: string;
  sourceLane: "structured-assessment" | "authentic-capture";
  sourceType: "electronic-assessment" | CapturedLearningEvidenceSourceType;
  sourceId: string;
  sourceLabel: string;
  provenance: {
    originatingSubsystem: string;
    schemaVersion: number;
    reviewState: string | null;
  };
  assessmentInterpretation: {
    developmentalStatus: LearningEvidenceResultV1["interpretation"]["developmentalStatus"];
    attemptId: string;
    attemptKind: LearningEvidenceResultV1["assessment"]["attemptKind"];
  } | null;
};

const sourceLabels: Record<CapturedLearningEvidenceSourceType, string> = {
  "captured-photo": "Capture · photo",
  "captured-video": "Capture · video",
  "work-sample": "Work sample",
  "parent-observation": "Parent observation",
  "practical-observation": "Practical observation",
  note: "Capture · note",
  "document-file": "Capture · document",
};

function assessmentEvent(
  result: LearningEvidenceResultV1,
): LearningEvidenceTimelineEventV1 {
  return {
    id: `assessment:${result.id}`,
    learnerId: result.learnerId,
    constructId: result.construct.constructId,
    continuumId: result.construct.continuumId,
    occurredAt: result.evaluatedAt,
    sourceLane: "structured-assessment",
    sourceType: "electronic-assessment",
    sourceId: result.assessment.attemptId,
    sourceLabel:
      result.assessment.attemptKind === "recheck" ? "Recheck assessment" : "Initial assessment",
    provenance: {
      originatingSubsystem: result.provenance.originatingSubsystem,
      schemaVersion: result.schemaVersion,
      reviewState: result.humanControl.reviewState,
    },
    assessmentInterpretation: {
      developmentalStatus: result.interpretation.developmentalStatus,
      attemptId: result.assessment.attemptId,
      attemptKind: result.assessment.attemptKind,
    },
  };
}

function captureEvent(
  evidence: CapturedLearningEvidenceV1,
  link: CapturedEvidenceConstructLinkV1,
): LearningEvidenceTimelineEventV1 {
  return {
    id: `capture:${evidence.evidenceId}:${link.linkId}`,
    learnerId: evidence.learnerId,
    constructId: link.construct.constructId,
    continuumId: link.construct.continuumId,
    occurredAt: evidence.capturedAt,
    sourceLane: "authentic-capture",
    sourceType: evidence.sourceType,
    sourceId: evidence.evidenceId,
    sourceLabel: sourceLabels[evidence.sourceType],
    provenance: {
      originatingSubsystem: evidence.originatingSubsystem,
      schemaVersion: evidence.schemaVersion,
      reviewState: link.reviewState,
    },
    assessmentInterpretation: null,
  };
}

export function projectLearningEvidenceTimeline(input: {
  learnerId: string;
  constructId?: string;
  assessmentResults: readonly LearningEvidenceResultV1[];
  capturedEvidence: readonly CapturedLearningEvidenceV1[];
}): LearningEvidenceTimelineEventV1[] {
  const assessmentEvents = input.assessmentResults
    .filter(
      (result) =>
        result.learnerId === input.learnerId &&
        (!input.constructId || result.construct.constructId === input.constructId),
    )
    .map(assessmentEvent);
  const captureEvents = input.capturedEvidence.flatMap((evidence) => {
    if (evidence.learnerId !== input.learnerId) return [];
    return evidence.constructLinks
      .filter(
        (link) => !input.constructId || link.construct.constructId === input.constructId,
      )
      .map((link) => captureEvent(evidence, link));
  });

  return [...assessmentEvents, ...captureEvents].sort((left, right) => {
    const timeDifference = Date.parse(left.occurredAt) - Date.parse(right.occurredAt);
    return timeDifference || left.id.localeCompare(right.id);
  });
}
