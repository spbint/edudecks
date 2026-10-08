export const LEARNING_EVIDENCE_RESULT_SCHEMA =
  "mylearna-learning-evidence-result" as const;
export const LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION = 1 as const;

export const LEARNING_EVIDENCE_DEVELOPMENTAL_STATUSES = [
  "secure",
  "consolidating",
  "developing",
  "needs-support",
  "not-enough-evidence",
  "practical-confirmation-required",
] as const;

export type LearningEvidenceDevelopmentalStatus =
  (typeof LEARNING_EVIDENCE_DEVELOPMENTAL_STATUSES)[number];

export type LearningEvidenceSourceType =
  | "electronic-assessment"
  | "practical-observation"
  | "parent-observation"
  | "teacher-observation"
  | "work-sample"
  | "imported-evidence";

export type LearningEvidenceSufficiency =
  | "sufficient"
  | "limited"
  | "not-enough-evidence"
  | "unavailable"
  | "unresolved"
  | "unknown";

export type LearningEvidenceAvailability =
  | "available"
  | "inaccessible"
  | "unavailable"
  | "unknown";

export type LearningEvidencePracticalConfirmationState =
  | "not-required"
  | "required"
  | "confirmed"
  | "unavailable";

export type LearningEvidenceReviewState =
  | "not-reviewed"
  | "reviewed"
  | "accepted"
  | "rejected";

export type LearningEvidenceAttemptKind = "initial" | "recheck";

export type LearningEvidenceItemReference = {
  itemId: string;
  itemVersion: number;
  responseProvenance: {
    stage: string | null;
    progressionLevel: string | null;
    outcome: "correct" | "incorrect" | "unresolved" | "unavailable";
  };
};

export type LearningEvidenceLimitation = {
  code: string;
  description: string;
  evidenceCeiling: "routing-only" | "provisional" | "no-claim";
};

export type LearningEvidenceRecommendation = {
  recommendationId: string;
  recommendationVersion: string;
  category: string;
  label: string;
  reason: string;
  targetConstructId: string | null;
  targetProgressionIdentifier: string | null;
  handoffTarget: {
    kind: "broad-practice-family" | "pathways-review";
    label: string;
    href: string;
    referenceId: string | null;
  };
  pathwayMutation: "not-requested";
};

export type LearningEvidenceResultV1 = {
  schema: typeof LEARNING_EVIDENCE_RESULT_SCHEMA;
  schemaVersion: typeof LEARNING_EVIDENCE_RESULT_SCHEMA_VERSION;
  id: string;
  learnerId: string;
  product: {
    productId: string;
    productVersion: string;
    moduleId: string;
  };
  assessment: {
    assessmentId: string;
    assessmentVersion: number;
    attemptId: string;
    attemptKind: LearningEvidenceAttemptKind;
  };
  createdAt: string;
  evaluatedAt: string;
  construct: {
    learningDomain: "mathematics";
    continuumId: string;
    continuumLabel: string;
    constructId: string;
    constructName: string;
    authority: {
      authorityId: string;
      frameworkId: string;
      frameworkVersion: string;
      mappingVersion: string;
    };
    progression: {
      identifier: string;
      kind: "band" | "endpoint" | "unresolved";
      lowerLevel: string | null;
      upperLevel: string | null;
      endpointRelation: "below-or-around" | "at-least" | null;
    };
  };
  evidence: {
    sources: Array<{
      sourceType: LearningEvidenceSourceType;
      sourceId: string;
    }>;
    assessmentScope: "assessed" | "not-assessed";
    availability: LearningEvidenceAvailability;
    itemReferences: LearningEvidenceItemReference[];
    sufficiency: {
      state: LearningEvidenceSufficiency;
      reasonCodes: string[];
    };
    practicalConfirmation: {
      state: LearningEvidencePracticalConfirmationState;
      evidenceReference: string | null;
    };
    limitations: LearningEvidenceLimitation[];
  };
  interpretation: {
    developmentalStatus: LearningEvidenceDevelopmentalStatus;
    sourceMeaning: {
      placementStatus:
        | "candidate-band"
        | "endpoint"
        | "unresolved"
        | "not-assessed";
      evidenceClassification:
        | "routing-only"
        | "provisional-moderate"
        | "not-applicable";
    };
    explanation: string;
  };
  provenance: {
    deterministicRule: {
      ruleId: string;
      ruleVersion: string;
    };
    assessmentVersion: number;
    sourceItemVersions: Array<{
      itemId: string;
      itemVersion: number;
    }>;
    curriculumMappingVersion: string;
    evaluatedAt: string;
    originatingSubsystem: string;
    evidenceCeiling: "routing-only" | "provisional" | "no-claim";
  };
  recommendation: LearningEvidenceRecommendation | null;
  humanControl: {
    reviewState: LearningEvidenceReviewState;
    humanNoteReference: string | null;
    portfolioInclusion: "not-decided" | "include" | "exclude";
    confirmationState: "not-confirmed" | "confirmed" | "declined";
  };
};

export function defaultLearningEvidenceHumanControl(): LearningEvidenceResultV1["humanControl"] {
  return {
    reviewState: "not-reviewed",
    humanNoteReference: null,
    portfolioInclusion: "not-decided",
    confirmationState: "not-confirmed",
  };
}
