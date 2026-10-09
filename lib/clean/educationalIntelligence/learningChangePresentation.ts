import {
  MATHEMATICS_LEARNING_PROFILE_STATUS_COPY,
} from "./mathematicsLearningProfilePresentation";
import type { LearningEvidenceComparisonV1 } from "./learningEvidenceComparison";
import type { LearningEvidenceDevelopmentalStatus } from "./learningEvidenceResult";
import type { NumberOperationsLearningChangeV1 } from "./numberOperationsLearningChange";

export const LEARNING_CHANGE_PRESENTATION_SCHEMA =
  "mylearna-learning-change-presentation" as const;
export const LEARNING_CHANGE_PRESENTATION_SCHEMA_VERSION = 1 as const;

export type LearningChangeAreaPresentation = {
  continuumId: NumberOperationsLearningChangeV1["continua"][number]["continuumId"];
  areaName: string;
  comparisonValidity: "valid" | "not-comparable";
  previous: {
    status: LearningEvidenceDevelopmentalStatus;
    statusLabel: string;
    evidenceLabel: string;
  };
  current: {
    status: LearningEvidenceDevelopmentalStatus;
    statusLabel: string;
    evidenceLabel: string;
  };
  evidenceChange: {
    kind: LearningEvidenceComparisonV1["changes"]["evidence"];
    label: string;
    explanation: string;
  };
  interpretationChange: {
    kind: LearningEvidenceComparisonV1["changes"]["interpretation"];
    label: string;
    explanation: string;
  };
  practicalConfirmation: {
    kind: LearningEvidenceComparisonV1["changes"]["practicalConfirmation"];
    label: string;
  };
  recommendationChange: {
    kind: LearningEvidenceComparisonV1["changes"]["recommendation"];
    label: string;
  };
  progressionChange: LearningEvidenceComparisonV1["changes"]["progression"];
  whatChanged: string;
  currentNextLearning: {
    available: boolean;
    label: string;
    reason: string;
    href: string | null;
    pathwayMutation: "not-requested";
  };
};

export type LearningChangePresentationV1 = {
  schema: typeof LEARNING_CHANGE_PRESENTATION_SCHEMA;
  schemaVersion: typeof LEARNING_CHANGE_PRESENTATION_SCHEMA_VERSION;
  title: "Since the last check";
  scope: {
    label: "Number & Operations";
    fiveContinuaIndependent: true;
    wholeMathematicsCoverage: false;
  };
  learner: { displayName: string };
  attempts: {
    previous: { attemptLabel: string; assessedDateLabel: string };
    current: { attemptLabel: string; assessedDateLabel: string };
  };
  explanation: string;
  areas: LearningChangeAreaPresentation[];
  evidenceNote: string;
};

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error("Learning change requires valid dates.");
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(parsed));
}

function evidenceLabel(
  state: LearningEvidenceComparisonV1["previous"]["evidenceSufficiency"]["state"],
) {
  if (state === "sufficient") return "Enough evidence";
  if (state === "limited") return "Limited evidence";
  if (state === "unknown") return "Not assessed";
  if (state === "unresolved") return "Evidence still open";
  return "Not enough evidence";
}

function evidenceChangeCopy(
  kind: LearningEvidenceComparisonV1["changes"]["evidence"],
) {
  const copy: Record<typeof kind, { label: string; explanation: string }> = {
    unchanged: {
      label: "Evidence state unchanged",
      explanation: "The available evidence has the same sufficiency state as before.",
    },
    "new-evidence": {
      label: "New evidence collected",
      explanation:
        "A later check added evidence. New evidence alone does not prove learning movement.",
    },
    "evidence-now-sufficient": {
      label: "Evidence now supports an interpretation",
      explanation:
        "MyLearna now has enough information to make a useful judgement. This is an evidence change, not automatically proof of improvement.",
    },
    "evidence-now-insufficient": {
      label: "Current evidence is insufficient",
      explanation:
        "The latest check does not provide enough evidence to retain a definite interpretation.",
    },
    "evidence-state-changed": {
      label: "Evidence state changed",
      explanation: "The availability or sufficiency of evidence differs from the earlier check.",
    },
    "still-unresolved": {
      label: "Evidence remains unresolved",
      explanation: "MyLearna still does not have enough evidence for a useful judgement.",
    },
    "not-comparable": {
      label: "Evidence is not directly comparable",
      explanation:
        "The educational construct or mapping changed, so MyLearna has kept the two records separate.",
    },
  };
  return copy[kind];
}

function interpretationChangeCopy(
  kind: LearningEvidenceComparisonV1["changes"]["interpretation"],
) {
  const copy: Record<typeof kind, { label: string; explanation: string }> = {
    unchanged: {
      label: "Interpretation unchanged",
      explanation: "Current evidence supports a similar learning interpretation.",
    },
    "became-interpretable": {
      label: "An interpretation is now available",
      explanation:
        "New evidence now supports a learning interpretation; the earlier unknown state was not a lower result.",
    },
    "became-unresolved": {
      label: "Interpretation is now open",
      explanation:
        "The latest evidence is not sufficient to make the same kind of judgement.",
    },
    changed: {
      label: "Interpretation changed",
      explanation: "Current evidence supports a different starting point than the previous check.",
    },
    "not-comparable": {
      label: "Interpretations are not directly comparable",
      explanation: "A material construct or mapping difference prevents a defensible comparison.",
    },
  };
  return copy[kind];
}

function practicalLabel(
  kind: LearningEvidenceComparisonV1["changes"]["practicalConfirmation"],
) {
  return {
    unchanged: "Practical-confirmation state unchanged",
    resolved: "Practical confirmation resolved",
    required: "Practical confirmation is now required",
    "still-required": "Practical confirmation is still required",
    "not-comparable": "Practical-confirmation states are not comparable",
  }[kind];
}

function recommendationLabel(
  kind: LearningEvidenceComparisonV1["changes"]["recommendation"],
) {
  return {
    unchanged: "Recommendation unchanged",
    changed: "Recommendation changed",
    "became-available": "A recommendation is now available",
    "became-unavailable": "No current recommendation is available",
    "not-comparable": "Recommendations are not directly comparable",
  }[kind];
}

function whatChanged(comparison: LearningEvidenceComparisonV1) {
  if (comparison.alignment.validity === "not-comparable") {
    return "These records use incompatible construct or mapping references, so no learning-change claim is made.";
  }
  if (comparison.changes.practicalConfirmation === "resolved") {
    return "Practical evidence has resolved the earlier confirmation requirement.";
  }
  if (comparison.changes.evidence === "evidence-now-sufficient") {
    return "New evidence now gives MyLearna enough information to make a useful judgement in this area.";
  }
  if (comparison.changes.evidence === "evidence-now-insufficient") {
    return "The latest evidence leaves this area open rather than converting missing evidence into failure.";
  }
  if (comparison.changes.progression === "later-learning-position") {
    return "Evidence now supports a later learning position in this construct.";
  }
  if (comparison.changes.progression === "earlier-learning-position") {
    return "Current evidence supports an earlier learning position than the previous check; this is not labelled as going backwards.";
  }
  if (comparison.changes.interpretation === "changed") {
    return "Current evidence supports a different starting point than the previous check.";
  }
  if (comparison.changes.recommendation !== "unchanged") {
    return "The current learning position is similar, but the recommended next step has changed.";
  }
  if (comparison.changes.evidence === "new-evidence") {
    return "New evidence supports a similar interpretation and next learning step.";
  }
  return "The defensible interpretation, evidence state and recommendation are unchanged.";
}

function presentArea(
  area: NumberOperationsLearningChangeV1["continua"][number],
): LearningChangeAreaPresentation {
  const comparison = area.comparison;
  const previousStatus = MATHEMATICS_LEARNING_PROFILE_STATUS_COPY[
    comparison.previous.developmentalStatus
  ];
  const currentStatus = MATHEMATICS_LEARNING_PROFILE_STATUS_COPY[
    comparison.current.developmentalStatus
  ];
  const recommendation = comparison.current.recommendation;
  return {
    continuumId: area.continuumId,
    areaName: area.displayLabel,
    comparisonValidity: comparison.alignment.validity,
    previous: {
      status: comparison.previous.developmentalStatus,
      statusLabel: previousStatus.label,
      evidenceLabel: evidenceLabel(comparison.previous.evidenceSufficiency.state),
    },
    current: {
      status: comparison.current.developmentalStatus,
      statusLabel: currentStatus.label,
      evidenceLabel: evidenceLabel(comparison.current.evidenceSufficiency.state),
    },
    evidenceChange: {
      kind: comparison.changes.evidence,
      ...evidenceChangeCopy(comparison.changes.evidence),
    },
    interpretationChange: {
      kind: comparison.changes.interpretation,
      ...interpretationChangeCopy(comparison.changes.interpretation),
    },
    practicalConfirmation: {
      kind: comparison.changes.practicalConfirmation,
      label: practicalLabel(comparison.changes.practicalConfirmation),
    },
    recommendationChange: {
      kind: comparison.changes.recommendation,
      label: recommendationLabel(comparison.changes.recommendation),
    },
    progressionChange: comparison.changes.progression,
    whatChanged: whatChanged(comparison),
    currentNextLearning: recommendation
      ? {
          available: true,
          label: recommendation.label,
          reason: recommendation.reason,
          href: recommendation.handoffTarget.href,
          pathwayMutation: recommendation.pathwayMutation,
        }
      : {
          available: false,
          label: "Collect useful evidence next",
          reason: "No specific learning recommendation is made while evidence remains unresolved.",
          href: null,
          pathwayMutation: "not-requested",
        },
  };
}

export function presentLearningChange(input: {
  comparison: NumberOperationsLearningChangeV1;
  learnerDisplayName?: string | null;
}): LearningChangePresentationV1 {
  return {
    schema: LEARNING_CHANGE_PRESENTATION_SCHEMA,
    schemaVersion: LEARNING_CHANGE_PRESENTATION_SCHEMA_VERSION,
    title: "Since the last check",
    scope: {
      label: "Number & Operations",
      fiveContinuaIndependent: true,
      wholeMathematicsCoverage: false,
    },
    learner: {
      displayName: String(input.learnerDisplayName ?? "").trim() || "Learner",
    },
    attempts: {
      previous: {
        attemptLabel: "Previous check",
        assessedDateLabel: formatDate(input.comparison.previousAttempt.evaluatedAt),
      },
      current: {
        attemptLabel: "Current recheck",
        assessedDateLabel: formatDate(input.comparison.currentAttempt.evaluatedAt),
      },
    },
    explanation:
      "This view compares evidence, interpretation and next learning separately. It does not calculate a growth score or one overall Maths level.",
    areas: input.comparison.continua.map(presentArea),
    evidenceNote:
      "A changed evidence state is not automatically a change in learning. Each Number & Operations area is interpreted independently.",
  };
}
