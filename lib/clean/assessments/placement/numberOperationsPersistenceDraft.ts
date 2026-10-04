import type { NumberOperationsBaselineSummarySnapshot } from "./numberOperationsBaselineSnapshot";
import {
  getNumberOperationsPlacementItemById,
  type NumberOperationsPlacementPoolKind,
} from "./numberOperationsItemRegistry";

export type NumberOperationsBaselineAttemptPersistenceDraft = {
  schemaVersion: 1;
  frameworkId: string;
  formId: string;
  formVersion: number;
  mode: "diagnostic";
  status: "complete" | "partial";
  startedAt: string;
  completedAt: string;
  assessedSubElements: number;
  expectedSubElements: number;
  unresolvedSubElements: string[];
  profileSnapshot: NumberOperationsBaselineSummarySnapshot["profile"];
  evidencePreviewSnapshot: NumberOperationsBaselineSummarySnapshot["evidencePreview"];
  sourceRoute: "/assessments/maths-starting-point";
};

export type NumberOperationsBaselineResponsePersistenceDraft = {
  subElementKey: string;
  stageKind: "initial" | "reserve" | "branch" | "search" | "boundary";
  progressionLevel: number;
  stageDirection: "down" | "up" | null;
  bracketLowerP: number | null;
  bracketUpperP: number | null;
  itemId: string;
  itemVersion: number | null;
  itemPoolKind: NumberOperationsPlacementPoolKind | null;
  itemPoolKey: string | null;
  itemSnapshot: Record<string, unknown> | null;
  itemOrder: number;
  selectedOptionIds: string[];
  responseValue: string | null;
  correct: boolean;
  skillId: string;
  misconceptionTags: string[];
  timeSpentSeconds: number | null;
};

export type NumberOperationsBaselinePersistenceDraft = {
  attempt: NumberOperationsBaselineAttemptPersistenceDraft;
  responses: NumberOperationsBaselineResponsePersistenceDraft[];
};

function snapshotItem(value: unknown) {
  if (!value) return null;
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function buildNumberOperationsBaselinePersistenceDraft(
  snapshot: NumberOperationsBaselineSummarySnapshot,
): NumberOperationsBaselinePersistenceDraft {
  let itemOrder = 0;

  const responses = snapshot.subElementAttempts.flatMap((attempt) =>
    attempt.stages.flatMap((stage) =>
      stage.responses.map((response) => {
        itemOrder += 1;
        const registryEntry = getNumberOperationsPlacementItemById(response.itemId);
        return {
          subElementKey: attempt.subElementKey,
          stageKind: stage.stage,
          progressionLevel: stage.pLevel,
          stageDirection: stage.direction || null,
          bracketLowerP: stage.bracket?.lowerP ?? null,
          bracketUpperP: stage.bracket?.upperP ?? null,
          itemId: response.itemId,
          itemVersion: registryEntry?.item.version ?? null,
          itemPoolKind: registryEntry?.poolKind ?? null,
          itemPoolKey: registryEntry?.poolKey ?? null,
          itemSnapshot: snapshotItem(registryEntry?.item),
          itemOrder,
          selectedOptionIds: [...response.selectedOptionIds],
          responseValue: response.responseValue ?? null,
          correct: response.correct,
          skillId: response.skillId,
          misconceptionTags: [...response.misconceptionTags],
          timeSpentSeconds: response.timeSpentSeconds ?? null,
        } satisfies NumberOperationsBaselineResponsePersistenceDraft;
      }),
    ),
  );

  return {
    attempt: {
      schemaVersion: snapshot.schemaVersion,
      frameworkId: snapshot.frameworkId,
      formId: snapshot.formId,
      formVersion: snapshot.formVersion,
      mode: snapshot.mode,
      status: snapshot.status,
      startedAt: snapshot.startedAt,
      completedAt: snapshot.completedAt,
      assessedSubElements: snapshot.assessedSubElements,
      expectedSubElements: snapshot.expectedSubElements,
      unresolvedSubElements: [...snapshot.unresolvedSubElements],
      profileSnapshot: snapshot.profile,
      evidencePreviewSnapshot: snapshot.evidencePreview,
      sourceRoute: "/assessments/maths-starting-point",
    },
    responses,
  };
}
