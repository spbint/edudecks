import type { NumberOperationsProfile } from "./numberOperationsProfile";
import type { NumberOperationsSubElementKey } from "./numberOperationsPlacementResult";
import type { NumberOperationsSubElementAttemptTrace } from "./numberOperationsAttemptTrace";
import {
  buildNumberOperationsEvidencePreview,
  type NumberOperationsEvidencePreview,
} from "./numberOperationsEvidencePreview";

export type NumberOperationsBaselineSummarySnapshot = {
  schema: "mylearna-number-operations-baseline-summary";
  schemaVersion: 1;
  formId: "number-operations-baseline";
  formVersion: 1;
  frameworkId: NumberOperationsProfile["frameworkId"];
  mode: "diagnostic";
  status: "complete" | "partial";
  startedAt: string;
  completedAt: string;
  assessedSubElements: number;
  expectedSubElements: number;
  scopeSubElements: NumberOperationsSubElementKey[];
  unresolvedSubElements: NumberOperationsSubElementKey[];
  subElementAttempts: NumberOperationsSubElementAttemptTrace[];
  profile: NumberOperationsProfile;
  evidencePreview: NumberOperationsEvidencePreview;
  persistencePolicy: {
    pathwayAttemptCompatible: false;
    reason: string;
    saveFormalEvidenceAutomatically: false;
    parentConfirmationRequiredForEvidence: true;
    updatePathwayStatusAutomatically: false;
    updateAssessmentConfidenceAutomatically: false;
  };
};

function iso(value: string, field: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    throw new Error(`${field} must be a valid ISO-compatible datetime.`);
  }
  return new Date(timestamp).toISOString();
}

export function buildNumberOperationsBaselineSummarySnapshot(input: {
  profile: NumberOperationsProfile;
  unresolvedSubElements?: NumberOperationsSubElementKey[];
  subElementAttempts?: NumberOperationsSubElementAttemptTrace[];
  startedAt: string;
  completedAt: string;
}): NumberOperationsBaselineSummarySnapshot {
  const startedAt = iso(input.startedAt, "startedAt");
  const completedAt = iso(input.completedAt, "completedAt");

  if (Date.parse(completedAt) < Date.parse(startedAt)) {
    throw new Error("completedAt must not be earlier than startedAt.");
  }

  const scopeSet = new Set(input.profile.expectedSubElementKeys);
  const unresolvedSubElements = Array.from(
    new Set(input.unresolvedSubElements || []),
  ).filter((key) => scopeSet.has(key));

  return {
    schema: "mylearna-number-operations-baseline-summary",
    schemaVersion: 1,
    formId: "number-operations-baseline",
    formVersion: 1,
    frameworkId: input.profile.frameworkId,
    mode: "diagnostic",
    status:
      input.profile.complete && unresolvedSubElements.length === 0
        ? "complete"
        : "partial",
    startedAt,
    completedAt,
    assessedSubElements: input.profile.assessedSubElements,
    expectedSubElements: input.profile.expectedSubElements,
    scopeSubElements: [...input.profile.expectedSubElementKeys],
    unresolvedSubElements,
    subElementAttempts: (input.subElementAttempts || []).filter((attempt) =>
      scopeSet.has(attempt.subElementKey),
    ),
    profile: input.profile,
    evidencePreview: buildNumberOperationsEvidencePreview(input.profile),
    persistencePolicy: {
      pathwayAttemptCompatible: false,
      reason:
        input.profile.expectedSubElements === 1
          ? "This focused starting-point check is scoped to a Numeracy progression area rather than one canonical My Pathways step, so it must not be written as a pathway-step assessment attempt."
          : "The current assessment_attempts model requires one pathway_step_id/stage/step, while the Number & Operations baseline spans multiple independent progression sub-elements.",
      saveFormalEvidenceAutomatically: false,
      parentConfirmationRequiredForEvidence: true,
      updatePathwayStatusAutomatically: false,
      updateAssessmentConfidenceAutomatically: false,
    },
  };
}
