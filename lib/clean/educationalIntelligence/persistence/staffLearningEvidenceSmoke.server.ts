import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { presentMathematicsLearningProfile } from "../mathematicsLearningProfilePresentation";
import { projectNumberOperationsLearningProfile } from "../numberOperationsLearningProfile";
import type { LearningEvidenceResultV1 } from "../learningEvidenceResult";
import { createSupabaseLearningEvidenceRepository } from "./supabaseLearningEvidenceRepository.server";
import { projectTrustedStartingPointPersistence } from "./startingPointPersistenceAuthority.server";
import {
  EI_STAGING_BRANCH_NAME,
  EI_STAGING_PROJECT_REF,
  type StaffLearningEvidenceHistory,
  type StaffLearningEvidenceSaveRequest,
  type StaffLearningEvidenceSavedAttempt,
} from "./staffLearningEvidenceSmoke";

const ALLOWED_REQUEST_KEYS = new Set([
  "operation",
  "familyId",
  "learnerId",
  "attemptId",
  "attemptKind",
  "draft",
]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class StaffLearningEvidenceSmokeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StaffLearningEvidenceSmokeError";
  }
}
function clean(value: unknown) {
  return String(value ?? "").trim();
}

function requireUuid(value: unknown, label: string) {
  const candidate = clean(value);
  if (!UUID_PATTERN.test(candidate)) {
    throw new StaffLearningEvidenceSmokeError(`${label} is invalid.`, 400);
  }
  return candidate;
}

export function parseStaffLearningEvidenceSaveRequest(
  value: unknown,
): StaffLearningEvidenceSaveRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StaffLearningEvidenceSmokeError("Invalid persistence request.", 400);
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !ALLOWED_REQUEST_KEYS.has(key))) {
    throw new StaffLearningEvidenceSmokeError(
      "Only raw assessment evidence may be submitted.",
      400,
    );
  }
  if (record.operation !== "save-starting-point") {
    throw new StaffLearningEvidenceSmokeError("Invalid persistence operation.", 400);
  }
  const attemptKind = record.attemptKind;
  if (attemptKind !== "initial" && attemptKind !== "recheck") {
    throw new StaffLearningEvidenceSmokeError("Invalid attempt kind.", 400);
  }
  const attemptId = clean(record.attemptId);
  if (
    attemptId.length < 8 ||
    attemptId.length > 160 ||
    /\s/.test(attemptId)
  ) {
    throw new StaffLearningEvidenceSmokeError("Invalid attempt identity.", 400);
  }
  if (!record.draft || typeof record.draft !== "object" || Array.isArray(record.draft)) {
    throw new StaffLearningEvidenceSmokeError(
      "Canonical assessment evidence is required.",
      400,
    );
  }

  return {
    operation: "save-starting-point",
    familyId: requireUuid(record.familyId, "Family"),
    learnerId: requireUuid(record.learnerId, "Learner"),
    attemptId,
    attemptKind,
    draft: record.draft as StaffLearningEvidenceSaveRequest["draft"],
  };
}

async function requireOwnedStagingLearner(input: {
  client: SupabaseClient;
  actorUserId: string;
  familyId: string;
  learnerId: string;
}) {
  const [membership, learner] = await Promise.all([
    input.client
      .from("family_members")
      .select("id")
      .eq("family_id", input.familyId)
      .eq("user_id", input.actorUserId)
      .maybeSingle(),
    input.client
      .from("learners")
      .select("id,first_name,preferred_name")
      .eq("family_id", input.familyId)
      .eq("id", input.learnerId)
      .maybeSingle(),
  ]);
  if (membership.error || learner.error) {
    throw new StaffLearningEvidenceSmokeError(
      "Could not verify the staging learner envelope.",
      503,
    );
  }
  if (!membership.data || !learner.data) {
    throw new StaffLearningEvidenceSmokeError(
      "The staging learner does not belong to this staff tenant.",
      403,
    );
  }
  const row = learner.data as {
    first_name?: string | null;
    preferred_name?: string | null;
  };
  return clean(row.preferred_name) || clean(row.first_name) || "Staging learner";
}

function provenanceSummary(results: LearningEvidenceResultV1[]) {
  const rules = new Set(
    results.map(
      (result) =>
        `${result.provenance.deterministicRule.ruleId}@${result.provenance.deterministicRule.ruleVersion}`,
    ),
  );
  const mappings = new Set(
    results.map((result) => result.provenance.curriculumMappingVersion),
  );
  return `Deterministic ${[...rules].join(", ")}; mapping ${[...mappings].join(", ")}; ${results.length} canonical continuum records.`;
}

function assertReviewDefaults(
  reviews: Array<{
    reviewState: string;
    confirmationState: string;
    portfolioInclusion: string;
  }>,
) {
  if (
    reviews.some(
      (review) =>
        review.reviewState !== "not-reviewed" ||
        review.confirmationState !== "not-confirmed" ||
        review.portfolioInclusion !== "not-decided",
    )
  ) {
    throw new StaffLearningEvidenceSmokeError(
      "Persisted human-control defaults are not safe.",
      500,
    );
  }
}

export async function saveTrustedStaffLearningEvidence(input: {
  client: SupabaseClient;
  actorUserId: string;
  request: StaffLearningEvidenceSaveRequest;
}) {
  const learnerDisplayName = await requireOwnedStagingLearner({
    client: input.client,
    actorUserId: input.actorUserId,
    familyId: input.request.familyId,
    learnerId: input.request.learnerId,
  });

  let projected: ReturnType<typeof projectTrustedStartingPointPersistence>;
  try {
    projected = projectTrustedStartingPointPersistence({
      draft: input.request.draft,
      learnerId: input.request.learnerId,
      attemptId: input.request.attemptId,
      attemptKind: input.request.attemptKind,
      allowNonPublishedItems: true,
    });
  } catch {
    throw new StaffLearningEvidenceSmokeError(
      "The submitted assessment evidence could not be authoritatively replayed.",
      400,
    );
  }

  const repository = createSupabaseLearningEvidenceRepository(input.client);
  let saved;
  try {
    saved = await repository.saveCanonicalResults({
      actorUserId: input.actorUserId,
      familyId: input.request.familyId,
      learnerId: input.request.learnerId,
      attempt: projected.attempt,
      results: projected.results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (/conflict|different educational content/i.test(message)) {
      throw new StaffLearningEvidenceSmokeError(
        "That attempt identity already contains different canonical evidence.",
        409,
      );
    }
    throw new StaffLearningEvidenceSmokeError(
      "The canonical result could not be saved to intelligence-staging.",
      503,
    );
  }

  const canonicalResults = saved.results.map((entry) => entry.result);
  assertReviewDefaults(saved.results.map((entry) => entry.review));
  const profile = projectNumberOperationsLearningProfile(canonicalResults);
  const presentation = presentMathematicsLearningProfile({
    profile,
    learnerDisplayName,
  });

  return {
    target: {
      branchName: EI_STAGING_BRANCH_NAME,
      projectRef: EI_STAGING_PROJECT_REF,
    },
    saved: {
      attemptId: saved.attempt.attemptId,
      attemptKind: saved.attempt.attemptKind,
      assessmentId: saved.attempt.assessmentId,
      assessmentVersion: saved.attempt.assessmentVersion,
      startedAt: saved.attempt.startedAt,
      completedAt: saved.attempt.completedAt,
      evaluatedAt: saved.attempt.evaluatedAt,
      resultCount: canonicalResults.length,
      reused: saved.reused,
      reviewDefaults: {
        reviewState: "not-reviewed" as const,
        confirmationState: "not-confirmed" as const,
        portfolioInclusion: "not-decided" as const,
      },
      provenanceSummary: provenanceSummary(canonicalResults),
      presentation,
    } satisfies StaffLearningEvidenceSavedAttempt,
  };
}

export async function loadStaffLearningEvidenceHistory(input: {
  client: SupabaseClient;
  actorUserId: string;
  familyId: string;
  learnerId: string;
}): Promise<StaffLearningEvidenceHistory> {
  const familyId = requireUuid(input.familyId, "Family");
  const learnerId = requireUuid(input.learnerId, "Learner");
  const learnerDisplayName = await requireOwnedStagingLearner({
    client: input.client,
    actorUserId: input.actorUserId,
    familyId,
    learnerId,
  });
  const repository = createSupabaseLearningEvidenceRepository(input.client);
  const [attempts, results] = await Promise.all([
    repository.listAttemptsChronologically({ familyId, learnerId }),
    repository.listLearnerAssessmentResults({
      familyId,
      learnerId,
      moduleId: "number-operations",
      assessmentId: "number-operations-baseline",
    }),
  ]);

  const histories: StaffLearningEvidenceSavedAttempt[] = [];
  for (const attempt of attempts.filter(
    (entry) => entry.assessmentId === "number-operations-baseline",
  )) {
    const attemptResults = results.filter(
      (entry) => entry.attemptStorageId === attempt.storageId,
    );
    if (attemptResults.length !== attempt.expectedResultCount) {
      throw new StaffLearningEvidenceSmokeError(
        "A persisted assessment profile is incomplete.",
        500,
      );
    }
    assertReviewDefaults(attemptResults.map((entry) => entry.review));
    const canonicalResults = attemptResults.map((entry) => entry.result);
    const profile = projectNumberOperationsLearningProfile(canonicalResults);
    histories.push({
      attemptId: attempt.attemptId,
      attemptKind: attempt.attemptKind,
      assessmentId: attempt.assessmentId,
      assessmentVersion: attempt.assessmentVersion,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      evaluatedAt: attempt.evaluatedAt,
      resultCount: canonicalResults.length,
      reused: false,
      reviewDefaults: {
        reviewState: "not-reviewed",
        confirmationState: "not-confirmed",
        portfolioInclusion: "not-decided",
      },
      provenanceSummary: provenanceSummary(canonicalResults),
      presentation: presentMathematicsLearningProfile({
        profile,
        learnerDisplayName,
      }),
    });
  }

  return {
    target: {
      branchName: EI_STAGING_BRANCH_NAME,
      projectRef: EI_STAGING_PROJECT_REF,
    },
    learner: { id: learnerId, displayName: learnerDisplayName },
    attempts: histories,
  };
}
