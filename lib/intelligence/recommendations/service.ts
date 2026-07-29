import { buildLearningPlanRecommendationInput, RecommendationHandoffError } from "@/lib/intelligence/recommendations/handoff";
import { createDeterministicRecommendationEngine } from "@/lib/intelligence/recommendations/engine";
import { RECOMMENDATION_ENGINE_VERSION, RECOMMENDATION_RULES_VERSION } from "@/lib/intelligence/recommendations/types";
import type {
  ApprovedPlanRevision,
  ApprovedPlanRevisionRepository,
  FamilyOwnedResourceRepository,
  LearningPlanRecommendationInput,
  RecommendationEngine,
  RecommendationInteractionEvent,
  RecommendationInteractionEventType,
  RecommendationInteractionRepository,
  RecommendationInteractionState,
  RecommendationResult,
} from "@/lib/intelligence/recommendations/types";
import type { IntelligenceRouteDiagnostics } from "@/lib/intelligence/serverDiagnostics";

export class RecommendationServiceError extends Error {
  readonly code: "not_approved" | "malformed_plan" | "invalid_input" | "not_found" | "persistence";
  readonly issues: string[];

  constructor(code: RecommendationServiceError["code"], message: string, issues: string[] = []) {
    super(message);
    this.name = "RecommendationServiceError";
    this.code = code;
    this.issues = issues;
  }
}

export interface RecommendationService {
  getForUser(userId: string, snapshot: ApprovedPlanRevision, includeDismissed?: boolean): Promise<RecommendationResult>;
  recordEventForUser(userId: string, snapshot: ApprovedPlanRevision, event: { recommendationId: string; eventType: RecommendationInteractionEventType; metadata?: Record<string, unknown> }): Promise<RecommendationInteractionEvent>;
}

function states(events: RecommendationInteractionEvent[]): Record<string, RecommendationInteractionState> {
  const result: Record<string, RecommendationInteractionState> = {};
  for (const event of events) {
    const current = result[event.recommendationId] ?? { recommendationId: event.recommendationId, ownedDecision: null, saved: false, dismissed: false, prepared: false, completed: false };
    if (event.eventType === "owned_confirmation") current.ownedDecision = "owned";
    if (event.eventType === "not_owned_confirmation") current.ownedDecision = "not_owned";
    if (event.eventType === "save") current.saved = true;
    if (event.eventType === "dismiss") current.dismissed = true;
    if (event.eventType === "restore") current.dismissed = false;
    if (event.eventType === "prepared") current.prepared = true;
    if (event.eventType === "completed") current.completed = true;
    result[event.recommendationId] = current;
  }
  return result;
}

function mapHandoffError(error: unknown): RecommendationServiceError {
  if (error instanceof RecommendationHandoffError) {
    return new RecommendationServiceError(error.code === "not_approved" ? "not_approved" : "malformed_plan", error.message, error.issues);
  }
  return new RecommendationServiceError("malformed_plan", "The approved plan could not be prepared for recommendations.");
}

export function createRecommendationService(options: {
  approvedPlanRepository: ApprovedPlanRevisionRepository;
  ownedResourceRepository: FamilyOwnedResourceRepository;
  interactionRepository: RecommendationInteractionRepository;
  engine?: RecommendationEngine;
  now?: () => Date;
  diagnostics?: IntelligenceRouteDiagnostics;
}): RecommendationService {
  const engine = options.engine ?? createDeterministicRecommendationEngine();
  const now = options.now ?? (() => new Date());

  return {
    async getForUser(userId, snapshot, includeDismissed = false) {
      if (!userId.trim() || snapshot.userId !== userId) throw new RecommendationServiceError("not_found", "The approved plan is not available.");
      let input: LearningPlanRecommendationInput;
      try {
        input = buildLearningPlanRecommendationInput(snapshot);
      } catch (error) {
        throw mapHandoffError(error);
      }
      try {
        const [ownedResources, events] = await Promise.all([
          options.ownedResourceRepository.listForUser(userId),
          options.interactionRepository.listForRevision(userId, snapshot.planId, snapshot.revisionId),
        ]);
        options.diagnostics?.stageStart("recommendation_build");
        try {
          const result = engine.generateRecommendations(input, { ownedResources, interactionStates: states(events), includeDismissed, now });
          options.diagnostics?.stageSuccess("recommendation_build");
          return result;
        } catch (error) {
          options.diagnostics?.stageFailure("recommendation_build", error);
          throw error;
        }
      } catch (error) {
        if (error instanceof RecommendationServiceError) throw error;
        throw new RecommendationServiceError("persistence", "Recommendations are temporarily unavailable.");
      }
    },

    async recordEventForUser(userId, snapshot, event) {
      if (!userId.trim() || snapshot.userId !== userId) throw new RecommendationServiceError("not_found", "The approved plan is not available.");
      const result = await this.getForUser(userId, snapshot, true);
      const candidate = [...result.recommendations, ...result.dismissedRecommendations].find((item) => item.recommendationId === event.recommendationId);
      if (!candidate) throw new RecommendationServiceError("invalid_input", "That recommendation does not belong to this approved revision.");
      try {
        return await options.interactionRepository.recordForUser(userId, {
          planId: snapshot.planId,
          revisionId: snapshot.revisionId,
          revisionNumber: snapshot.revisionNumber,
          recommendationId: event.recommendationId,
          eventType: event.eventType,
          metadata: event.metadata ?? {},
          engineVersion: RECOMMENDATION_ENGINE_VERSION,
          rulesVersion: RECOMMENDATION_RULES_VERSION,
        });
      } catch {
        throw new RecommendationServiceError("persistence", "We could not save that recommendation action.");
      }
    },
  };
}
