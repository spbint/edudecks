import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  validateCanonicalLearningEvidenceSave,
  type LearningEvidencePersistenceRepository,
  type PersistedLearningEvidenceAttempt,
  type PersistedLearningEvidenceResult,
} from "./learningEvidencePersistence";
import type { LearningEvidenceResultV1 } from "../learningEvidenceResult";

type AttemptRow = {
  id: string;
  family_id: string;
  learner_id: string;
  attempt_identity: string;
  product_id: string;
  product_version: string;
  module_id: string;
  assessment_id: string;
  assessment_version: number;
  attempt_kind: "initial" | "recheck";
  completion_state: "complete" | "focused";
  started_at: string;
  completed_at: string;
  evaluated_at: string;
  source_subsystem: string;
  result_schema_version: 1;
  scope_continuum_ids: string[];
  expected_result_count: number;
  created_by_user_id: string;
  created_at: string;
};

type ResultRow = {
  id: string;
  attempt_id: string;
  family_id: string;
  learner_id: string;
  canonical_payload: LearningEvidenceResultV1;
  created_at: string;
  learning_evidence_result_reviews:
    | {
        review_state: "not-reviewed" | "reviewed" | "accepted" | "rejected";
        confirmation_state: "not-confirmed" | "confirmed" | "declined";
        portfolio_inclusion: "not-decided" | "include" | "exclude";
        human_note_reference: string | null;
      }
    | Array<{
        review_state: "not-reviewed" | "reviewed" | "accepted" | "rejected";
        confirmation_state: "not-confirmed" | "confirmed" | "declined";
        portfolio_inclusion: "not-decided" | "include" | "exclude";
        human_note_reference: string | null;
      }>
    | null;
};

const ATTEMPT_SELECT = [
  "id",
  "family_id",
  "learner_id",
  "attempt_identity",
  "product_id",
  "product_version",
  "module_id",
  "assessment_id",
  "assessment_version",
  "attempt_kind",
  "completion_state",
  "started_at",
  "completed_at",
  "evaluated_at",
  "source_subsystem",
  "result_schema_version",
  "scope_continuum_ids",
  "expected_result_count",
  "created_by_user_id",
  "created_at",
].join(",");

const RESULT_SELECT = [
  "id",
  "attempt_id",
  "family_id",
  "learner_id",
  "canonical_payload",
  "created_at",
  "learning_evidence_result_reviews(review_state,confirmation_state,portfolio_inclusion,human_note_reference)",
].join(",");

function mapAttempt(row: AttemptRow): PersistedLearningEvidenceAttempt {
  return {
    persistenceSchemaVersion: 1,
    storageId: row.id,
    familyId: row.family_id,
    learnerId: row.learner_id,
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    attemptId: row.attempt_identity,
    productId: row.product_id,
    productVersion: row.product_version,
    moduleId: row.module_id,
    assessmentId: row.assessment_id,
    assessmentVersion: row.assessment_version,
    attemptKind: row.attempt_kind,
    completionState: row.completion_state,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    evaluatedAt: row.evaluated_at,
    sourceSubsystem: row.source_subsystem,
    resultSchemaVersion: row.result_schema_version,
    scopeContinuumIds: [...row.scope_continuum_ids],
    expectedResultCount: row.expected_result_count,
  };
}

function mapResult(row: ResultRow): PersistedLearningEvidenceResult {
  const joinedReview = Array.isArray(row.learning_evidence_result_reviews)
    ? row.learning_evidence_result_reviews[0]
    : row.learning_evidence_result_reviews;
  const review = joinedReview ?? {
    review_state: "not-reviewed" as const,
    confirmation_state: "not-confirmed" as const,
    portfolio_inclusion: "not-decided" as const,
    human_note_reference: null,
  };
  return {
    storageId: row.id,
    attemptStorageId: row.attempt_id,
    familyId: row.family_id,
    learnerId: row.learner_id,
    result: structuredClone(row.canonical_payload),
    review: {
      reviewState: review.review_state,
      confirmationState: review.confirmation_state,
      portfolioInclusion: review.portfolio_inclusion,
      humanNoteReference: review.human_note_reference,
    },
    createdAt: row.created_at,
  };
}

function fail(error: { message: string } | null, fallback: string): never {
  throw new Error(error?.message || fallback);
}

/**
 * Creates the server-only storage repository. Callers must supply a trusted
 * server client. The browser never imports this module and never receives a
 * service-role credential.
 */
export function createSupabaseLearningEvidenceRepository(
  client: SupabaseClient,
): LearningEvidencePersistenceRepository {
  async function resultsForAttempt(input: {
    familyId: string;
    learnerId: string;
    attemptStorageId: string;
  }) {
    const response = await client
      .from("learning_evidence_results")
      .select(RESULT_SELECT)
      .eq("family_id", input.familyId)
      .eq("learner_id", input.learnerId)
      .eq("attempt_id", input.attemptStorageId)
      .order("evaluated_at", { ascending: true });
    if (response.error) fail(response.error, "Could not load canonical results.");
    return ((response.data ?? []) as unknown as ResultRow[]).map(mapResult);
  }

  return {
    async saveCanonicalResults(rawInput) {
      const input = validateCanonicalLearningEvidenceSave(rawInput);
      const save = await client.rpc("mylearna_save_learning_evidence_results_v1", {
        p_actor_user_id: input.actorUserId,
        p_family_id: input.familyId,
        p_learner_id: input.learnerId,
        p_attempt: input.attempt,
        p_results: input.results,
      });
      if (save.error) fail(save.error, "Could not save canonical learning evidence.");
      const receipt = save.data as
        | { attemptStorageId?: string; reused?: boolean }
        | null;
      const attemptStorageId = String(receipt?.attemptStorageId ?? "").trim();
      if (!attemptStorageId) throw new Error("Persistence returned no attempt identity.");

      const attemptResponse = await client
        .from("learning_evidence_attempts")
        .select(ATTEMPT_SELECT)
        .eq("id", attemptStorageId)
        .eq("family_id", input.familyId)
        .eq("learner_id", input.learnerId)
        .single();
      if (attemptResponse.error || !attemptResponse.data) {
        fail(attemptResponse.error, "Could not reload the saved attempt.");
      }
      const results = await resultsForAttempt({
        familyId: input.familyId,
        learnerId: input.learnerId,
        attemptStorageId,
      });
      if (results.length !== input.results.length) {
        throw new Error("The saved canonical profile is incomplete.");
      }
      return {
        attempt: mapAttempt(attemptResponse.data as unknown as AttemptRow),
        results,
        reused: receipt?.reused === true,
      };
    },

    async loadResult(input) {
      const response = await client
        .from("learning_evidence_results")
        .select(RESULT_SELECT)
        .eq("family_id", input.familyId)
        .eq("learner_id", input.learnerId)
        .eq("result_identity", input.resultId)
        .maybeSingle();
      if (response.error) fail(response.error, "Could not load canonical result.");
      return response.data ? mapResult(response.data as unknown as ResultRow) : null;
    },

    async listLearnerResultHistory(input) {
      const response = await client
        .from("learning_evidence_results")
        .select(RESULT_SELECT)
        .eq("family_id", input.familyId)
        .eq("learner_id", input.learnerId)
        .order("evaluated_at", { ascending: true });
      if (response.error) fail(response.error, "Could not load result history.");
      return ((response.data ?? []) as unknown as ResultRow[]).map(mapResult);
    },

    async listLearnerAssessmentResults(input) {
      const response = await client
        .from("learning_evidence_results")
        .select(RESULT_SELECT)
        .eq("family_id", input.familyId)
        .eq("learner_id", input.learnerId)
        .eq("module_id", input.moduleId)
        .eq("assessment_id", input.assessmentId)
        .order("evaluated_at", { ascending: true });
      if (response.error) fail(response.error, "Could not load assessment history.");
      return ((response.data ?? []) as unknown as ResultRow[]).map(mapResult);
    },

    async listAttemptsChronologically(input) {
      const response = await client
        .from("learning_evidence_attempts")
        .select(ATTEMPT_SELECT)
        .eq("family_id", input.familyId)
        .eq("learner_id", input.learnerId)
        .order("evaluated_at", { ascending: true });
      if (response.error) fail(response.error, "Could not load attempt history.");
      return ((response.data ?? []) as unknown as AttemptRow[]).map(mapAttempt);
    },
  };
}
