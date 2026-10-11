import { NUMBER_OPERATIONS_PROFILE_ORDER } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import type { NumberOperationsSubElementKey } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import type { LearningEvidenceTimelineEventV1 } from "./capture/learningEvidenceTimeline";
import type { LearningChangeAreaPresentation, LearningChangePresentationV1 } from "./learningChangePresentation";
import type {
  MathematicsLearningProfileAreaPresentation,
  MathematicsLearningProfilePresentationV1,
} from "./mathematicsLearningProfilePresentation";

export const FAMILY_EVIDENCE_REVIEW_SCHEMA =
  "mylearna-family-evidence-review-presentation" as const;
export const FAMILY_EVIDENCE_REVIEW_SCHEMA_VERSION = 1 as const;

const AREA_LABELS: Record<NumberOperationsSubElementKey, string> = {
  "number-place-value": "Number and place value",
  "counting-processes": "Counting processes",
  "additive-strategies": "Additive strategies",
  "multiplicative-strategies": "Multiplicative strategies",
  "understanding-money": "Understanding money",
};

const CAPTURE_SOURCE_LABELS = {
  "captured-photo": "Captured photo",
  "captured-video": "Captured video",
  "work-sample": "Captured work",
  "parent-observation": "Parent observation",
  "practical-observation": "Practical observation",
  note: "Learning note",
  "document-file": "Captured document",
} as const;

export const FAMILY_EVIDENCE_REVIEW_STATE_LABELS: Record<string, string> = {
  unreviewed: "Not reviewed yet",
  reviewed: "Reviewed",
  "confirmed-relevant": "Relevant to this learning",
  "not-relevant": "Not relevant to this learning",
};

export type FamilyEvidenceReviewTimelineItem = {
  eventId: string;
  occurredAt: string;
  dateLabel: string;
  sourceLane: "assessment" | "capture";
  sourceLabel: string;
  title: string;
  detail: string;
  reviewLabel: string | null;
};

export type FamilyEvidenceReviewArea = {
  continuumId: NumberOperationsSubElementKey;
  areaName: string;
  currentView: {
    hasAssessmentInterpretation: boolean;
    status: MathematicsLearningProfileAreaPresentation["status"] | null;
    statusLabel: string;
    explanation: string;
    evidenceSufficiencyLabel: string;
    practicalConfirmationLabel: string | null;
    assessedDateLabel: string | null;
  };
  evidence: {
    assessmentEventCount: number;
    capturedEvidenceCount: number;
    capturedBySource: Array<{ sourceLabel: string; count: number }>;
    statement: string;
    captureBoundaryStatement: string;
  };
  change: {
    available: boolean;
    previousStatusLabel: string | null;
    currentStatusLabel: string | null;
    whatChanged: string;
    evidenceExplanation: string | null;
  };
  unknowns: {
    hasOpenQuestions: boolean;
    statements: string[];
  };
  nextLearning: MathematicsLearningProfileAreaPresentation["nextLearning"] | null;
  timeline: FamilyEvidenceReviewTimelineItem[];
};

export type FamilyEvidenceReviewPresentationV1 = {
  schema: typeof FAMILY_EVIDENCE_REVIEW_SCHEMA;
  schemaVersion: typeof FAMILY_EVIDENCE_REVIEW_SCHEMA_VERSION;
  title: "My Learning Evidence";
  scope: {
    label: "Number & Operations";
    statement: string;
    fiveContinuaIndependent: true;
    wholeMathematicsCoverage: false;
  };
  learner: { displayName: string };
  introduction: string;
  assessmentCaptureBoundary: string;
  areas: FamilyEvidenceReviewArea[];
  controls: {
    readOnly: true;
    portfolioMutation: "not-requested";
    pathwayMutation: "not-requested";
    customerWritePath: false;
  };
};

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error("Family evidence review requires valid evidence dates.");
  }
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

function timelineItem(
  event: LearningEvidenceTimelineEventV1,
  captureLabels: Readonly<Record<string, string>>,
): FamilyEvidenceReviewTimelineItem {
  if (event.sourceLane === "structured-assessment") {
    return {
      eventId: event.id,
      occurredAt: event.occurredAt,
      dateLabel: formatDate(event.occurredAt),
      sourceLane: "assessment",
      sourceLabel: "Assessment",
      title: event.sourceLabel,
      detail: "Structured assessment evidence informed the recorded learning view.",
      reviewLabel: null,
    };
  }

  const captureSourceType =
    event.sourceType === "electronic-assessment" ? "note" : event.sourceType;
  const sourceLabel = CAPTURE_SOURCE_LABELS[captureSourceType];
  const reviewLabel = FAMILY_EVIDENCE_REVIEW_STATE_LABELS[event.provenance.reviewState ?? "unreviewed"] ??
    "Not reviewed yet";
  return {
    eventId: event.id,
    occurredAt: event.occurredAt,
    dateLabel: formatDate(event.occurredAt),
    sourceLane: "capture",
    sourceLabel,
    title: captureLabels[event.sourceId] ?? sourceLabel,
    detail: "Authentic family evidence is associated with this learning area. It has not changed the assessment judgement automatically.",
    reviewLabel,
  };
}

function captureSummary(items: FamilyEvidenceReviewTimelineItem[]) {
  const captures = items.filter((item) => item.sourceLane === "capture");
  const counts = new Map<string, number>();
  captures.forEach((item) => counts.set(item.sourceLabel, (counts.get(item.sourceLabel) ?? 0) + 1));
  return {
    count: captures.length,
    bySource: [...counts.entries()].map(([sourceLabel, count]) => ({ sourceLabel, count })),
  };
}

function unknownStatements(
  area: MathematicsLearningProfileAreaPresentation | undefined,
  timeline: FamilyEvidenceReviewTimelineItem[],
) {
  const statements: string[] = [];
  const captures = timeline.filter((event) => event.sourceLane === "capture");
  if (!area) {
    statements.push("We haven't checked this area yet.");
  } else if (area.status === "not-enough-evidence") {
    statements.push(
      "MyLearna does not yet have enough structured evidence to make a useful assessment judgement.",
    );
  }
  if (area?.status === "practical-confirmation-required") {
    statements.push(
      "This area still needs practical confirmation before a stronger assessment judgement can be made.",
    );
  }
  if (captures.some((event) => event.reviewLabel === "Not reviewed yet")) {
    statements.push("Some captured evidence is available but has not been reviewed yet.");
  }
  if (!captures.length) {
    statements.push("No captured learning evidence has been associated with this area yet.");
  }
  return statements;
}

function changeFor(
  comparison: LearningChangePresentationV1 | null | undefined,
  continuumId: NumberOperationsSubElementKey,
): LearningChangeAreaPresentation | undefined {
  return comparison?.areas.find((area) => area.continuumId === continuumId);
}

export function presentFamilyEvidenceReview(input: {
  learnerDisplayName?: string | null;
  currentProfile?: MathematicsLearningProfilePresentationV1 | null;
  comparison?: LearningChangePresentationV1 | null;
  timeline: readonly LearningEvidenceTimelineEventV1[];
  captureLabelsBySourceId?: Readonly<Record<string, string>>;
}): FamilyEvidenceReviewPresentationV1 {
  const captureLabels = input.captureLabelsBySourceId ?? {};
  return {
    schema: FAMILY_EVIDENCE_REVIEW_SCHEMA,
    schemaVersion: FAMILY_EVIDENCE_REVIEW_SCHEMA_VERSION,
    title: "My Learning Evidence",
    scope: {
      label: "Number & Operations",
      statement:
        "This view brings together assessment evidence and family-captured evidence across five independent Number & Operations areas. It is not a whole-Mathematics score.",
      fiveContinuaIndependent: true,
      wholeMathematicsCoverage: false,
    },
    learner: {
      displayName: String(input.learnerDisplayName ?? "").trim() || "Learner",
    },
    introduction: "See what MyLearna currently knows, what evidence your family has captured, what remains open and the next useful learning step.",
    assessmentCaptureBoundary:
      "Assessment results provide the structured learning interpretation. Captured work and observations remain supporting evidence and never change that interpretation automatically.",
    areas: NUMBER_OPERATIONS_PROFILE_ORDER.map((continuumId) => {
      const area = input.currentProfile?.areas.find(
        (candidate) => candidate.continuumId === continuumId,
      );
      const change = changeFor(input.comparison, continuumId);
      const timeline = input.timeline
        .filter((event) => event.continuumId === continuumId)
        .map((event) => timelineItem(event, captureLabels));
      const captures = captureSummary(timeline);
      const unknowns = unknownStatements(area, timeline);
      return {
        continuumId,
        areaName: area?.areaName ?? AREA_LABELS[continuumId],
        currentView: area
          ? {
              hasAssessmentInterpretation: true,
              status: area.status,
              statusLabel: area.statusLabel,
              explanation: area.statusExplanation,
              evidenceSufficiencyLabel: area.evidence.sufficiencyLabel,
              practicalConfirmationLabel: area.evidence.practicalConfirmationLabel,
              assessedDateLabel: input.currentProfile?.assessment.assessedDateLabel ?? null,
            }
          : {
              hasAssessmentInterpretation: false,
              status: null,
              statusLabel: "Not assessed",
              explanation: "MyLearna has not made an assessment judgement for this area.",
              evidenceSufficiencyLabel: "No structured assessment evidence",
              practicalConfirmationLabel: null,
              assessedDateLabel: null,
            },
        evidence: {
          assessmentEventCount: timeline.filter((item) => item.sourceLane === "assessment").length,
          capturedEvidenceCount: captures.count,
          capturedBySource: captures.bySource,
          statement: captures.count
            ? `Your family has captured ${captures.count} ${captures.count === 1 ? "piece" : "pieces"} of learning evidence associated with this area.`
            : "No captured learning evidence is associated with this area yet.",
          captureBoundaryStatement:
            "Captured evidence is shown separately and has not changed the assessment status automatically.",
        },
        change: change
          ? {
              available: true,
              previousStatusLabel: change.previous.statusLabel,
              currentStatusLabel: change.current.statusLabel,
              whatChanged: change.whatChanged,
              evidenceExplanation: change.evidenceChange.explanation,
            }
          : {
              available: false,
              previousStatusLabel: null,
              currentStatusLabel: null,
              whatChanged: "A later recheck can help show whether the structured assessment evidence has changed.",
              evidenceExplanation: null,
            },
        unknowns: {
          hasOpenQuestions: unknowns.length > 0,
          statements: unknowns,
        },
        nextLearning: area?.nextLearning ?? null,
        timeline,
      };
    }),
    controls: {
      readOnly: true,
      portfolioMutation: "not-requested",
      pathwayMutation: "not-requested",
      customerWritePath: false,
    },
  };
}
