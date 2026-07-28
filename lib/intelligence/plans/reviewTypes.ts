import type { PlanProvenance } from "@/lib/intelligence/types";
import type {
  GeneratedPlanContent,
  LearningPlanDraft,
  LearningPlanType,
  PlanReviewMetadata,
  PlanWorkflowStatus,
} from "@/lib/intelligence/plans/types";

export type ReviewAction = "save" | "validate" | "approve" | "return_to_draft" | "archive" | "regenerate";

export interface ReviewValidationResult {
  valid: boolean;
  repaired: boolean;
  issues: string[];
  safetyAcknowledgementRequired: boolean;
  safetyAcknowledged: boolean;
  validatedAt: string;
}

export interface PlanReviewEnvelope {
  plan: LearningPlanDraft;
  workflowStatus: PlanWorkflowStatus;
  currentRevision: number;
  originalGeneratedRevision: number;
  review: PlanReviewMetadata;
  provenance: PlanProvenance;
}

export interface ReviewActionInput {
  action: ReviewAction;
  expectedRevision: number;
  content?: GeneratedPlanContent;
  /** Whether the request JSON explicitly supplied a content property. */
  contentProvided?: boolean;
  safetyAcknowledged?: boolean;
}

export interface ReviewActionResult extends PlanReviewEnvelope {
  state: "saved" | "validated" | "approved" | "returned_to_draft" | "archived" | "regenerated";
}

export interface LearningPlanReviewRepository {
  getReviewPlanForUser(
    userId: string,
    ideaId: string,
    sourceId: string,
    planType: LearningPlanType,
  ): Promise<PlanReviewEnvelope | null>;
  saveParentEditForUser(
    userId: string,
    current: PlanReviewEnvelope,
    content: GeneratedPlanContent,
    provenance: PlanProvenance,
    expectedRevision: number,
  ): Promise<PlanReviewEnvelope>;
  updateReviewStateForUser(
    userId: string,
    current: PlanReviewEnvelope,
    workflowStatus: PlanWorkflowStatus,
    content: GeneratedPlanContent,
    provenance: PlanProvenance,
    expectedRevision: number,
  ): Promise<PlanReviewEnvelope>;
}
