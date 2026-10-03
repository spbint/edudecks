import type { NumberOperationsBaselineSummarySnapshot } from "./numberOperationsBaselineSnapshot";

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
  sourceRoute: "/assessment-lab/placement-simulator";
};

export type NumberOperationsBaselineResponsePersistenceDraft = {
  subElementKey: string;
  stageKind: "initial" | "reserve" | "branch" | "search" | "boundary";
  progressionLevel: number;
  stageDirection: "down" | "up" | null;
  bracketLowerP: number | null;
  bracketUpperP: number | null;
  itemId: string;
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

export function buildNumberOperationsBaselinePersistenceDraft(
  snapshot: NumberOperationsBaselineSummarySnapshot,
): NumberOperationsBaselinePersistenceDraft {
  let itemOrder = 0;

  const responses = snapshot.subElementAttempts.flatMap((attempt) =>
    attempt.stages.flatMap((stage) =>
      stage.responses.map((response) => {
        itemOrder += 1;
        return {
          subElementKey: attempt.subElementKey,
          stageKind: stage.stage,
          progressionLevel: stage.pLevel,
          stageDirection: stage.direction || null,
          bracketLowerP: stage.bracket?.lowerP ?? null,
          bracketUpperP: stage.bracket?.upperP ?? null,
          itemId: response.itemId,
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
      sourceRoute: "/assessment-lab/placement-simulator",
    },
    responses,
  };
}
