import type { PlanProvenance, PlanStatus } from "@/lib/intelligence/types";
import type { LearningPlanType } from "@/lib/intelligence/plans/types";

export const RECOMMENDATION_ENGINE_VERSION = "mylearna-recommendation-engine-v1";
export const RECOMMENDATION_RULES_VERSION = "mylearna-recommendation-rules-v1";
export const RECOMMENDATION_SCHEMA_VERSION = "mylearna-learning-plan-recommendation-input-v1";

export type RecommendationObjectType =
  | "learning_activity"
  | "preparation_action"
  | "required_resource"
  | "optional_extension_resource"
  | "evidence_capture_action"
  | "portfolio_reflection_action"
  | "safety_supervision_action";

export type ResourceClassification =
  | "already_owned"
  | "household_common"
  | "reusable"
  | "consumable"
  | "borrowable"
  | "free_digital"
  | "missing_essential"
  | "optional_extension"
  | "unsuitable_blocked";

export type RecommendationReasonCode =
  | "SAFETY_REQUIRED"
  | "LEARNING_SEQUENCE"
  | "PREPARATION_REQUIRED"
  | "OWNED_RESOURCE_MATCH"
  | "HOUSEHOLD_ALTERNATIVE"
  | "FREE_DIGITAL_ALTERNATIVE"
  | "BORROWABLE_SUBSTITUTE"
  | "MISSING_ESSENTIAL"
  | "OPTIONAL_EXTENSION"
  | "EVIDENCE_CAPTURE"
  | "PORTFOLIO_REFLECTION"
  | "UNSUITABLE_BLOCKED";

export interface LearningPlanRecommendationInput {
  planId: string;
  planType: LearningPlanType;
  revisionId: string;
  revisionNumber: number;
  learnerAgeOrStage: string | null;
  subjects: string[];
  curriculumConcepts: string[];
  learningIntentions: string[];
  duration: {
    value: number | null;
    unit: "minutes" | "lessons" | "weeks" | "sessions" | null;
  };
  lessonUnitSequence: Array<{
    sequenceId: string;
    order: number;
    title: string;
    objective: string;
    activity: string;
    durationMinutes: number | null;
    notes: string;
  }>;
  requiredResources: RecommendationResourceInput[];
  optionalResources: RecommendationResourceInput[];
  preparationRequirements: string[];
  evidencePrompts: string[];
  portfolioPrompts: string[];
  safetySupervisionRequirements: string[];
  sourceProvenance: PlanProvenance;
  parentPreferences: string | null;
  approvedAt: string;
  schemaVersion: string;
}

export interface RecommendationResourceInput {
  name: string;
  resourceKey: string;
  category: string | null;
  quantity: string | null;
  required: boolean;
  url: string | null;
  notes: string;
}

export interface FamilyOwnedResource {
  id: string;
  userId: string;
  name: string;
  normalizedResourceKey: string;
  category: string | null;
  quantity: string | null;
  condition: string | null;
  active: boolean;
  source: string;
  provenance: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type RecommendationInteractionEventType =
  | "impression"
  | "owned_confirmation"
  | "not_owned_confirmation"
  | "save"
  | "dismiss"
  | "restore"
  | "prepared"
  | "completed";

export interface RecommendationInteractionEvent {
  id: string;
  userId: string;
  planId: string;
  revisionId: string;
  revisionNumber: number;
  recommendationId: string;
  eventType: RecommendationInteractionEventType;
  metadata: Record<string, unknown>;
  engineVersion: string;
  rulesVersion: string;
  createdAt: string;
}

export interface RecommendationInteractionState {
  recommendationId: string;
  ownedDecision: "owned" | "not_owned" | null;
  saved: boolean;
  dismissed: boolean;
  prepared: boolean;
  completed: boolean;
}

export interface LearningRecommendation {
  recommendationId: string;
  objectType: RecommendationObjectType;
  title: string;
  summary: string;
  category: string;
  priorityRank: number;
  reasonCode: RecommendationReasonCode;
  parentReadableReason: string;
  required: boolean;
  resourceClassification: ResourceClassification | null;
  resourceKey: string | null;
  sourcePlan: {
    planId: string;
    revisionId: string;
    revisionNumber: number;
  };
  engineVersion: string;
  rulesVersion: string;
  provenance: {
    sourceProvenance: PlanProvenance;
    generatedAt: string;
  };
  interaction: RecommendationInteractionState;
  scoreComponents?: {
    learning: number;
    safety: number;
    required: number;
    ownership: number;
    freeAlternative: number;
    optionalPenalty: number;
  };
}

export interface RecommendationEngineContext {
  ownedResources: FamilyOwnedResource[];
  interactionStates?: Record<string, RecommendationInteractionState>;
  includeDismissed?: boolean;
  now?: () => Date;
}

export interface RecommendationDebugInfo {
  eligibility: "approved";
  scoreComponents: Array<{ recommendationId: string; components: NonNullable<LearningRecommendation["scoreComponents"]> }>;
  ruleVersion: string;
  reasonCodes: Array<{ recommendationId: string; reasonCode: RecommendationReasonCode }>;
  exclusions: Array<{ recommendationId: string; reason: string }>;
  ownershipMatches: Array<{ recommendationId: string; resourceKey: string; ownedResourceId: string }>;
}

export interface RecommendationResult {
  input: LearningPlanRecommendationInput;
  recommendations: LearningRecommendation[];
  dismissedRecommendations: LearningRecommendation[];
  debug: RecommendationDebugInfo;
}

export interface ApprovedPlanRevision {
  userId: string;
  ideaId: string;
  sourceId: string;
  planId: string;
  planType: LearningPlanType;
  revisionId: string;
  revisionNumber: number;
  status: PlanStatus;
  content: Record<string, unknown>;
  provenance: PlanProvenance;
  approvedAt: string;
}

export interface ApprovedPlanRevisionRepository {
  getApprovedRevisionForUser(
    userId: string,
    ideaId: string,
    sourceId: string,
    planType: LearningPlanType,
    planId: string,
    revisionNumber: number,
  ): Promise<ApprovedPlanRevision | null>;
}

export interface FamilyOwnedResourceRepository {
  listForUser(userId: string): Promise<FamilyOwnedResource[]>;
  createForUser(userId: string, input: Omit<FamilyOwnedResource, "id" | "userId" | "createdAt" | "updatedAt">): Promise<FamilyOwnedResource>;
}

export interface RecommendationInteractionRepository {
  listForRevision(userId: string, planId: string, revisionId: string): Promise<RecommendationInteractionEvent[]>;
  recordForUser(userId: string, event: Omit<RecommendationInteractionEvent, "id" | "userId" | "createdAt">): Promise<RecommendationInteractionEvent>;
}

export interface RecommendationEngine {
  generateRecommendations(input: LearningPlanRecommendationInput, context: RecommendationEngineContext): RecommendationResult;
  classifyResources(resource: RecommendationResourceInput, ownedResources: FamilyOwnedResource[], interaction?: RecommendationInteractionState): ResourceClassification;
  rankRecommendations(context: RecommendationEngineContext, candidates: LearningRecommendation[]): LearningRecommendation[];
  explainRecommendation(candidate: LearningRecommendation, context: RecommendationEngineContext): string;
}
