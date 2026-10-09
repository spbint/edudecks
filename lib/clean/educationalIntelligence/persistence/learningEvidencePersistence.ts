import type {
  LearningEvidenceAttemptKind,
  LearningEvidenceResultV1,
} from "../learningEvidenceResult";

export const LEARNING_EVIDENCE_PERSISTENCE_SCHEMA_VERSION = 1 as const;

export type LearningEvidenceAttemptV1 = {
  persistenceSchemaVersion: typeof LEARNING_EVIDENCE_PERSISTENCE_SCHEMA_VERSION;
  attemptId: string;
  productId: string;
  productVersion: string;
  moduleId: string;
  assessmentId: string;
  assessmentVersion: number;
  attemptKind: LearningEvidenceAttemptKind;
  completionState: "complete" | "focused";
  startedAt: string;
  completedAt: string;
  evaluatedAt: string;
  sourceSubsystem: string;
  resultSchemaVersion: 1;
  scopeContinuumIds: string[];
  expectedResultCount: number;
};

export type SaveCanonicalLearningEvidenceInput = {
  actorUserId: string;
  familyId: string;
  learnerId: string;
  attempt: LearningEvidenceAttemptV1;
  results: LearningEvidenceResultV1[];
};

export type PersistedLearningEvidenceAttempt = LearningEvidenceAttemptV1 & {
  storageId: string;
  familyId: string;
  learnerId: string;
  createdByUserId: string;
  createdAt: string;
};

export type PersistedLearningEvidenceResult = {
  storageId: string;
  attemptStorageId: string;
  familyId: string;
  learnerId: string;
  result: LearningEvidenceResultV1;
  review: {
    reviewState: "not-reviewed" | "reviewed" | "accepted" | "rejected";
    confirmationState: "not-confirmed" | "confirmed" | "declined";
    portfolioInclusion: "not-decided" | "include" | "exclude";
    humanNoteReference: string | null;
  };
  createdAt: string;
};

export type SaveCanonicalLearningEvidenceResult = {
  attempt: PersistedLearningEvidenceAttempt;
  results: PersistedLearningEvidenceResult[];
  reused: boolean;
};

export interface LearningEvidencePersistenceRepository {
  saveCanonicalResults(
    input: SaveCanonicalLearningEvidenceInput,
  ): Promise<SaveCanonicalLearningEvidenceResult>;
  loadResult(input: {
    familyId: string;
    learnerId: string;
    resultId: string;
  }): Promise<PersistedLearningEvidenceResult | null>;
  listLearnerResultHistory(input: {
    familyId: string;
    learnerId: string;
  }): Promise<PersistedLearningEvidenceResult[]>;
  listLearnerAssessmentResults(input: {
    familyId: string;
    learnerId: string;
    moduleId: string;
    assessmentId: string;
  }): Promise<PersistedLearningEvidenceResult[]>;
  listAttemptsChronologically(input: {
    familyId: string;
    learnerId: string;
  }): Promise<PersistedLearningEvidenceAttempt[]>;
}

const NUMBER_OPERATIONS_CONTINUA = [
  "number-place-value",
  "counting-processes",
  "additive-strategies",
  "multiplicative-strategies",
  "understanding-money",
] as const;

function required(value: string, label: string) {
  const cleaned = String(value ?? "").trim();
  if (!cleaned) throw new Error(`${label} is required.`);
  return cleaned;
}

function timestamp(value: string, label: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be a valid timestamp.`);
  return new Date(parsed).toISOString();
}

function unique(values: readonly string[], label: string) {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must not contain duplicates.`);
  }
}

export function validateCanonicalLearningEvidenceSave(
  input: SaveCanonicalLearningEvidenceInput,
): SaveCanonicalLearningEvidenceInput {
  const actorUserId = required(input.actorUserId, "actorUserId");
  const familyId = required(input.familyId, "familyId");
  const learnerId = required(input.learnerId, "learnerId");
  const attemptId = required(input.attempt.attemptId, "attempt.attemptId");
  const scopeContinuumIds = input.attempt.scopeContinuumIds.map((value) =>
    required(value, "scope continuum"),
  );
  unique(scopeContinuumIds, "scopeContinuumIds");

  if (input.results.length !== input.attempt.expectedResultCount) {
    throw new Error("The canonical result set is incomplete.");
  }

  const resultIds = input.results.map((result) => result.id);
  const constructIds = input.results.map((result) => result.construct.constructId);
  const startedAt = timestamp(input.attempt.startedAt, "attempt.startedAt");
  const completedAt = timestamp(input.attempt.completedAt, "attempt.completedAt");
  const evaluatedAt = timestamp(input.attempt.evaluatedAt, "attempt.evaluatedAt");
  unique(resultIds, "result IDs");
  unique(constructIds, "construct IDs");

  if (input.attempt.assessmentId === "number-operations-baseline") {
    const continua = input.results.map((result) => result.construct.continuumId);
    unique(continua, "Number & Operations continua");
    if (
      continua.length !== NUMBER_OPERATIONS_CONTINUA.length ||
      NUMBER_OPERATIONS_CONTINUA.some((continuum) => !continua.includes(continuum))
    ) {
      throw new Error(
        "Number & Operations persistence requires five independent continuum results.",
      );
    }
  }

  for (const result of input.results) {
    if (
      result.learnerId !== learnerId ||
      result.assessment.attemptId !== attemptId ||
      result.assessment.assessmentId !== input.attempt.assessmentId ||
      result.assessment.assessmentVersion !== input.attempt.assessmentVersion ||
      result.assessment.attemptKind !== input.attempt.attemptKind ||
      result.schemaVersion !== input.attempt.resultSchemaVersion ||
      result.product.productId !== input.attempt.productId ||
      result.product.productVersion !== input.attempt.productVersion ||
      result.product.moduleId !== input.attempt.moduleId ||
      result.provenance.originatingSubsystem !== input.attempt.sourceSubsystem ||
      timestamp(result.evaluatedAt, "result.evaluatedAt") !== evaluatedAt
    ) {
      throw new Error("A canonical result does not match its attempt envelope.");
    }
    if (
      result.recommendation &&
      result.recommendation.pathwayMutation !== "not-requested"
    ) {
      throw new Error("Persisted recommendations must not mutate My Pathways.");
    }
  }

  if (Date.parse(completedAt) < Date.parse(startedAt)) {
    throw new Error("Attempt completion cannot precede its start.");
  }

  return {
    actorUserId,
    familyId,
    learnerId,
    attempt: {
      ...input.attempt,
      attemptId,
      startedAt,
      completedAt,
      evaluatedAt,
      scopeContinuumIds,
    },
    results: input.results.map((result) => structuredClone(result)),
  };
}

export function buildLearningEvidenceAttemptV1(input: {
  results: LearningEvidenceResultV1[];
  startedAt: string;
  scopeContinuumIds: string[];
}): LearningEvidenceAttemptV1 {
  const first = input.results[0];
  if (!first) throw new Error("At least one canonical result is required.");

  return {
    persistenceSchemaVersion: LEARNING_EVIDENCE_PERSISTENCE_SCHEMA_VERSION,
    attemptId: first.assessment.attemptId,
    productId: first.product.productId,
    productVersion: first.product.productVersion,
    moduleId: first.product.moduleId,
    assessmentId: first.assessment.assessmentId,
    assessmentVersion: first.assessment.assessmentVersion,
    attemptKind: first.assessment.attemptKind,
    completionState:
      input.scopeContinuumIds.length === NUMBER_OPERATIONS_CONTINUA.length
        ? "complete"
        : "focused",
    startedAt: timestamp(input.startedAt, "startedAt"),
    completedAt: timestamp(first.evaluatedAt, "completedAt"),
    evaluatedAt: timestamp(first.evaluatedAt, "evaluatedAt"),
    sourceSubsystem: first.provenance.originatingSubsystem,
    resultSchemaVersion: first.schemaVersion,
    scopeContinuumIds: [...input.scopeContinuumIds],
    expectedResultCount: input.results.length,
  };
}

export function stableCanonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableCanonicalJson(entry)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableCanonicalJson(record[key])}`)
    .join(",")}}`;
}
