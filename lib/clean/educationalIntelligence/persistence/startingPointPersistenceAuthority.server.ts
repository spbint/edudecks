import "server-only";

import { NUMBER_OPERATIONS_STARTING_POINT_PRODUCT } from "@/lib/clean/assessments/numberOperationsStartingPointProduct";
import { buildNumberOperationsBaselineSummarySnapshot } from "@/lib/clean/assessments/placement/numberOperationsBaselineSnapshot";
import type { NumberOperationsBaselinePersistenceDraft } from "@/lib/clean/assessments/placement/numberOperationsPersistenceDraft";
import { buildTrustedNumberOperationsBaselinePersistenceDraft } from "@/lib/clean/assessments/placement/numberOperationsPersistenceRouteReplay";
import { buildNumberOperationsSubElementAttemptTrace } from "@/lib/clean/assessments/placement/numberOperationsAttemptTrace";
import type { NumberOperationsSubElementKey } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import { projectStartingPointCompletion } from "../startingPointResultProjection";
import { buildLearningEvidenceAttemptV1 } from "./learningEvidencePersistence";

const continuumLabels = Object.fromEntries(
  NUMBER_OPERATIONS_STARTING_POINT_PRODUCT.assessedAreas.map((area) => [
    area.key,
    area.label,
  ]),
) as Record<NumberOperationsSubElementKey, string>;

function buildTrustedAttemptTraces(
  trusted: NumberOperationsBaselinePersistenceDraft,
) {
  return trusted.attempt.scopeSubElements.map((rawContinuum) => {
    const subElementKey = rawContinuum as NumberOperationsSubElementKey;
    const areaResponses = trusted.responses.filter(
      (response) => response.subElementKey === subElementKey,
    );
    const stages: Parameters<
      typeof buildNumberOperationsSubElementAttemptTrace
    >[0]["stages"] = [];

    for (const response of areaResponses) {
      const previous = stages[stages.length - 1];
      const sameStage =
        previous?.stage === response.stageKind &&
        previous.pLevel === response.progressionLevel &&
        (previous.direction ?? null) === response.stageDirection &&
        (previous.bracket?.lowerP ?? null) === response.bracketLowerP &&
        (previous.bracket?.upperP ?? null) === response.bracketUpperP;
      const canonicalResponse = {
        itemId: response.itemId,
        selectedOptionIds: [...response.selectedOptionIds],
        ...(response.responseValue !== null
          ? { responseValue: response.responseValue }
          : {}),
        correct: response.correct,
        skillId: response.skillId,
        misconceptionTags: [...response.misconceptionTags],
        ...(response.timeSpentSeconds !== null
          ? { timeSpentSeconds: response.timeSpentSeconds }
          : {}),
      };

      if (sameStage && previous) {
        previous.responses.push(canonicalResponse);
      } else {
        stages.push({
          stage: response.stageKind,
          pLevel: response.progressionLevel,
          ...(response.stageDirection
            ? { direction: response.stageDirection }
            : {}),
          ...(response.bracketLowerP !== null && response.bracketUpperP !== null
            ? {
                bracket: {
                  lowerP: response.bracketLowerP,
                  upperP: response.bracketUpperP,
                },
              }
            : {}),
          responses: [canonicalResponse],
        });
      }
    }

    const result =
      trusted.attempt.profileSnapshot.results.find(
        (candidate) => candidate.subElementKey === subElementKey,
      ) ?? null;
    return buildNumberOperationsSubElementAttemptTrace({
      subElementKey,
      subElementLabel: continuumLabels[subElementKey],
      stages,
      routeTrace: stages.map(
        (stage) => `${stage.stage}:P${stage.pLevel}:${stage.responses.length}`,
      ),
      evidenceLimitations: [...(result?.limitations ?? [])],
      result,
    });
  });
}

/**
 * Server authority bridge: raw browser evidence is sanitized, re-scored from
 * canonical items and deterministically route-replayed before any
 * LearningEvidenceResultV1 is projected. A submitted status, progression or
 * recommendation is never accepted as canonical truth.
 */
export function projectTrustedStartingPointPersistence(input: {
  draft: NumberOperationsBaselinePersistenceDraft;
  learnerId: string;
  attemptId: string;
  attemptKind: "initial" | "recheck";
  allowNonPublishedItems?: boolean;
}) {
  const trustedDraft = buildTrustedNumberOperationsBaselinePersistenceDraft(
    input.draft,
    { allowNonPublishedItems: input.allowNonPublishedItems },
  );
  const subElementAttempts = buildTrustedAttemptTraces(trustedDraft);
  const completion = buildNumberOperationsBaselineSummarySnapshot({
    profile: trustedDraft.attempt.profileSnapshot,
    unresolvedSubElements:
      trustedDraft.attempt.unresolvedSubElements as NumberOperationsSubElementKey[],
    subElementAttempts,
    startedAt: trustedDraft.attempt.startedAt,
    completedAt: trustedDraft.attempt.completedAt,
  });
  const itemVersions = Object.fromEntries(
    trustedDraft.responses.map((response) => [
      response.itemId,
      response.itemVersion as number,
    ]),
  );
  const projection = projectStartingPointCompletion({
    learnerId: input.learnerId,
    attemptId: input.attemptId,
    attemptKind: input.attemptKind,
    completion,
    itemVersions,
  });
  const attempt = buildLearningEvidenceAttemptV1({
    results: projection.results,
    startedAt: completion.startedAt,
    scopeContinuumIds: [...completion.scopeSubElements],
  });

  return {
    trustedDraft,
    completion,
    attempt,
    results: projection.results,
    profile: projection.profile,
  };
}
