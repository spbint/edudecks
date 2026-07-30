import type {
  IdeaSource,
  LessonPlan,
  PlanProvenance,
  UnitPlan,
} from "@/lib/intelligence/types";

export type LearningPlanType = "lesson" | "unit";

export type GenerationState =
  | "awaiting_input"
  | "generating"
  | "ready"
  | "validation_failed"
  | "provider_unavailable"
  | "timed_out"
  | "failed";

export type GenerationFailureCode =
  | "invalid_input"
  | "source_not_ready"
  | "draft_exists"
  | "generation_in_progress"
  | "throttled"
  | "provider_unavailable"
  | "provider_timeout"
  | "provider_failure"
  | "output_too_large"
  | "schema_invalid"
  | "persistence_failure";

export interface LearningPlanGenerationInput {
  planType: LearningPlanType;
  source: {
    sourceId: string;
    originalUrl: string;
    finalUrl: string | null;
    canonicalUrl: string | null;
    title: string | null;
    description: string | null;
    provider: string | null;
    extractedAt: string | null;
  };
  learnerAgeOrStage: string;
  subjects: string[];
  duration: number | null;
  durationUnit: "minutes" | "lessons" | "weeks" | "sessions" | null;
  parentInstructions: string | null;
}

export interface GeneratedSequenceItem {
  title: string;
  objective: string;
  activity: string;
  durationMinutes: number | null;
  notes: string;
}

export interface GeneratedResourceItem {
  name: string;
  category: string | null;
  quantity: string | null;
  required: boolean;
  url: string | null;
  notes: string;
}

export interface SourceAttribution {
  sourceId: string;
  originalUrl: string;
  finalUrl: string | null;
  canonicalUrl: string | null;
  title: string | null;
  provider: string | null;
  extractedAt: string | null;
}

export interface PlanValidationResult {
  valid: boolean;
  repaired: boolean;
  issues: string[];
  validatedAt: string;
}

export type PlanWorkflowStatus =
  | "generated_draft"
  | "editing"
  | "saved"
  | "ready_to_use"
  | "ready_for_approval"
  | "approved"
  | "returned_to_draft"
  | "archived";

export type PlanRevisionKind = "generated" | "parent_edit";

export interface PlanReviewMetadata {
  workflowStatus: PlanWorkflowStatus;
  originalGeneratedRevision: number;
  revisionKind: PlanRevisionKind;
  changedFields: string[];
  lastEditedAt: string | null;
  lastEditedByUserId: string | null;
  safetyAcknowledged: boolean;
  validation: PlanValidationResult & {
    safetyAcknowledgementRequired?: boolean;
  };
  readyToUsePreviousStatus?: "draft" | "saved";
}

export interface GeneratedPlanContent {
  planType: LearningPlanType;
  title: string;
  overview: string;
  subjects: string[];
  ageStage: string;
  duration: number | null;
  durationUnit: "minutes" | "lessons" | "weeks" | "sessions" | null;
  learningIntentions: string[];
  successCriteria: string[];
  sequence: GeneratedSequenceItem[];
  resourceRequirements: GeneratedResourceItem[];
  preparation: string[];
  discussionQuestions: string[];
  differentiation: string[];
  assessmentApproach: string;
  evidencePrompts: string[];
  portfolioPrompts: string[];
  safetySupervisionNotes: string[];
  sourceAttribution: SourceAttribution;
  limitationsAssumptions: string[];
  parentInstructions: string | null;
  generation: PlanGenerationMetadata;
  validation: PlanValidationResult;
  review?: PlanReviewMetadata;
}

export interface PlanGenerationMetadata {
  provider: string;
  model: string;
  modelVersion: string;
  promptVersion: string;
  schemaVersion: string;
  generatedAt: string;
  revision: number;
}

export type LearningPlanDraft = LessonPlan | UnitPlan;

export interface PersistedPlanInput {
  planType: LearningPlanType;
  ideaId: string;
  sourceId: string;
  revision: number;
  content: GeneratedPlanContent;
  provenance: PlanProvenance;
}

export interface LearningPlanRepository {
  getDraftForUser(
    userId: string,
    ideaId: string,
    sourceId: string,
    planType: LearningPlanType,
  ): Promise<LearningPlanDraft | null>;
  createDraftForUser(userId: string, input: PersistedPlanInput): Promise<LearningPlanDraft>;
  createRevisionForUser(
    userId: string,
    currentDraft: LearningPlanDraft,
    input: PersistedPlanInput,
  ): Promise<LearningPlanDraft>;
}

export interface LearningPlanGeneratorMetadata {
  provider: string;
  model: string;
  modelVersion: string;
}

export interface GenerationExecutionOptions {
  signal: AbortSignal;
}

export interface LearningPlanGenerator extends LearningPlanGeneratorMetadata {
  generateLessonPlan(
    input: LearningPlanGenerationInput,
    options: GenerationExecutionOptions,
  ): Promise<unknown>;
  generateUnitPlan(
    input: LearningPlanGenerationInput,
    options: GenerationExecutionOptions,
  ): Promise<unknown>;
}

export type GenerationServiceOptions = {
  repository: LearningPlanRepository;
  generator: LearningPlanGenerator;
  coordinator?: {
    inFlight: Set<string>;
    requestTimes: Map<string, number[]>;
  };
  now?: () => Date;
  requestTimeoutMs?: number;
  maxOutputBytes?: number;
  maxRetries?: number;
  throttleWindowMs?: number;
  maxRequestsPerUserPerWindow?: number;
};

export interface GenerationResult {
  state: "ready";
  plan: LearningPlanDraft;
  revision: number;
  regenerated: boolean;
}

export type SourceForGeneration = IdeaSource;
