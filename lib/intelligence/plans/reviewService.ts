import type { PlanProvenance, ParentEdit } from "@/lib/intelligence/types";
import type { GeneratedPlanContent, LearningPlanType, PlanReviewMetadata, PlanWorkflowStatus } from "@/lib/intelligence/plans/types";
import { changedPlanFields, planValidationResult, validateEditablePlanContent } from "@/lib/intelligence/plans/reviewValidation";
import type {
  LearningPlanReviewRepository,
  PlanReviewEnvelope,
  ReviewActionInput,
  ReviewActionResult,
  ReviewValidationResult,
} from "@/lib/intelligence/plans/reviewTypes";
import { PlanReviewRepositoryError } from "@/lib/intelligence/plans/reviewRepository";

export type PlanReviewErrorCode =
  | "invalid_input"
  | "validation_failed"
  | "approval_blocked"
  | "stale_revision"
  | "persistence_failure";

export class PlanReviewError extends Error {
  readonly code: PlanReviewErrorCode;
  readonly issues: string[];

  constructor(code: PlanReviewErrorCode, message: string, issues: string[] = []) {
    super(message);
    this.name = "PlanReviewError";
    this.code = code;
    this.issues = issues;
  }
}

export interface PlanReviewService {
  getForUser(
    userId: string,
    ideaId: string,
    sourceId: string,
    planType: LearningPlanType,
  ): Promise<PlanReviewEnvelope | null>;
  performAction(
    userId: string,
    ideaId: string,
    sourceId: string,
    planType: LearningPlanType,
    input: ReviewActionInput,
  ): Promise<ReviewActionResult>;
}

function contentOf(current: PlanReviewEnvelope) {
  return current.plan.content as unknown as GeneratedPlanContent;
}

function reviewFor(
  current: PlanReviewEnvelope,
  workflowStatus: PlanWorkflowStatus,
  validation: ReviewValidationResult,
  userId: string,
  now: string,
  changedFields: string[],
  safetyAcknowledged: boolean,
): PlanReviewMetadata {
  return {
    ...current.review,
    workflowStatus,
    originalGeneratedRevision: current.originalGeneratedRevision,
    revisionKind: workflowStatus === "editing" || changedFields.length ? "parent_edit" : current.review.revisionKind,
    changedFields,
    lastEditedAt: workflowStatus === "editing" || changedFields.length ? now : current.review.lastEditedAt,
    lastEditedByUserId: workflowStatus === "editing" || changedFields.length ? userId : current.review.lastEditedByUserId,
    safetyAcknowledged,
    validation: {
      ...planValidationResult(validation),
      safetyAcknowledgementRequired: validation.safetyAcknowledgementRequired,
    },
  };
}

function withReview(
  current: PlanReviewEnvelope,
  content: GeneratedPlanContent,
  review: PlanReviewMetadata,
): GeneratedPlanContent {
  return {
    ...content,
    review,
    validation: review.validation,
    sourceAttribution: contentOf(current).sourceAttribution,
    generation: contentOf(current).generation,
    parentInstructions: contentOf(current).parentInstructions,
  };
}

function provenanceForEdit(
  provenance: PlanProvenance,
  revision: number,
  userId: string,
  now: string,
  fields: string[],
): PlanProvenance {
  const edit: ParentEdit = {
    version: revision,
    editedAt: now,
    editedByUserId: userId,
    fields,
    summary: fields.length ? `Parent updated ${fields.join(", ")}.` : "Parent saved the plan draft.",
  };
  return {
    ...provenance,
    parentEdits: [...(provenance.parentEdits ?? []), edit],
  };
}

function ensureInput(input: ReviewActionInput) {
  if (!Number.isInteger(input.expectedRevision) || input.expectedRevision < 1) {
    throw new PlanReviewError("invalid_input", "A valid expected revision is required.");
  }
  if (!["save", "validate", "approve", "return_to_draft", "archive", "regenerate"].includes(input.action)) {
    throw new PlanReviewError("invalid_input", "That review action is not supported.");
  }
}

function mapRepositoryError(error: unknown): PlanReviewError {
  if (error instanceof PlanReviewRepositoryError && error.code === "stale_revision") {
    return new PlanReviewError("stale_revision", error.message);
  }
  return new PlanReviewError("persistence_failure", error instanceof Error ? error.message : "We could not save the plan review.");
}

export function createPlanReviewService(options: {
  repository: LearningPlanReviewRepository;
  now?: () => Date;
}): PlanReviewService {
  const now = options.now ?? (() => new Date());

  return {
    async getForUser(userId, ideaId, sourceId, planType) {
      if (!userId.trim()) throw new PlanReviewError("invalid_input", "Authentication is required.");
      try {
        return await options.repository.getReviewPlanForUser(userId, ideaId, sourceId, planType);
      } catch (error) {
        throw mapRepositoryError(error);
      }
    },

    async performAction(userId, ideaId, sourceId, planType, input) {
      if (!userId.trim()) throw new PlanReviewError("invalid_input", "Authentication is required.");
      ensureInput(input);
      if (input.action === "regenerate") {
        throw new PlanReviewError("invalid_input", "Regeneration must use the generation service.");
      }

      const current = await this.getForUser(userId, ideaId, sourceId, planType);
      if (!current) throw new PlanReviewError("persistence_failure", "The requested plan was not found.");
      if (current.currentRevision !== input.expectedRevision) {
        throw new PlanReviewError("stale_revision", "This plan changed elsewhere. Reload before continuing.");
      }

      const currentContent = contentOf(current);
      const contentProvided = input.contentProvided ?? input.content !== undefined;
      const candidate = input.content ?? currentContent;
      const timestamp = now().toISOString();
      const safetyAcknowledged = input.safetyAcknowledged === true;

      if (input.action === "save") {
        const checked = validateEditablePlanContent(candidate, currentContent, safetyAcknowledged, now);
        const review = reviewFor(current, "editing", checked.validation, userId, timestamp, checked.changedFields, safetyAcknowledged);
        const content = withReview(current, checked.content, review);
        const provenance = provenanceForEdit(current.provenance, input.expectedRevision + 1, userId, timestamp, checked.changedFields);
        try {
          const plan = await options.repository.saveParentEditForUser(userId, current, content, provenance, input.expectedRevision);
          return { ...plan, state: "saved" as const };
        } catch (error) {
          throw mapRepositoryError(error);
        }
      }

      const checked = validateEditablePlanContent(
        candidate,
        currentContent,
        safetyAcknowledged || current.review.safetyAcknowledged,
        now,
        input.action === "approve",
      );
      const changedFields = contentProvided ? changedPlanFields(currentContent, checked.content) : [];
      if (changedFields.length) {
        throw new PlanReviewError("invalid_input", "Save your edits before validating or changing the plan status.");
      }
      if (!checked.validation.valid) {
        throw new PlanReviewError(
          input.action === "approve" ? "approval_blocked" : "validation_failed",
          input.action === "approve" ? "Approval is blocked until the plan is valid." : "The plan needs attention before it can be approved.",
          checked.validation.issues,
        );
      }

      const workflowStatus: PlanWorkflowStatus = input.action === "validate"
        ? "ready_for_approval"
        : input.action === "approve"
          ? "approved"
          : input.action === "return_to_draft"
            ? "returned_to_draft"
            : "archived";
      const review = reviewFor(current, workflowStatus, checked.validation, userId, timestamp, [], safetyAcknowledged || current.review.safetyAcknowledged);
      const content = withReview(current, checked.content, review);
      const provenance: PlanProvenance = input.action === "approve"
        ? {
            ...current.provenance,
            finalApprovedVersion: current.currentRevision,
            finalApprovedAt: timestamp,
            finalApprovedByUserId: userId,
          }
        : current.provenance;
      try {
        const plan = await options.repository.updateReviewStateForUser(userId, current, workflowStatus, content, provenance, input.expectedRevision);
        const state = input.action === "validate"
          ? "validated"
          : input.action === "approve"
            ? "approved"
            : input.action === "return_to_draft"
              ? "returned_to_draft"
              : "archived";
        return { ...plan, state } as ReviewActionResult;
      } catch (error) {
        throw mapRepositoryError(error);
      }
    },
  };
}
