import { describe, expect, it } from "vitest";
import { buildNumberOperationsCandidateBandResult } from "./numberOperationsPlacementResult";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";
import { buildNumberOperationsSubElementAttemptTrace } from "./numberOperationsAttemptTrace";
import { buildNumberOperationsBaselineSummarySnapshot } from "./numberOperationsBaselineSnapshot";
import { buildNumberOperationsBaselinePersistenceDraft } from "./numberOperationsPersistenceDraft";

describe("Number Operations persistence draft", () => {
  it("flattens versioned baseline traces into one attempt plus ordered response rows", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 4,
      upperP: 5,
    });
    const profile = buildNumberOperationsProfile([result]);
    const trace = buildNumberOperationsSubElementAttemptTrace({
      subElementKey: "number-place-value",
      subElementLabel: "Number and place value",
      stages: [
        {
          stage: "initial",
          pLevel: 6,
          responses: [
            {
              itemId: "anchor-a",
              selectedOptionIds: ["wrong"],
              correct: false,
              skillId: "skill-a",
              misconceptionTags: ["m1"],
              timeSpentSeconds: 9,
            },
            {
              itemId: "anchor-b",
              selectedOptionIds: [],
              responseValue: "3400",
              correct: false,
              skillId: "skill-b",
              misconceptionTags: [],
              timeSpentSeconds: 7,
            },
          ],
        },
        {
          stage: "boundary",
          pLevel: 4,
          bracket: { lowerP: 3, upperP: 6 },
          responses: [
            {
              itemId: "boundary-a",
              selectedOptionIds: ["b"],
              correct: true,
              skillId: "skill-c",
              misconceptionTags: [],
            },
          ],
        },
      ],
      routeTrace: [],
      result,
    });

    const snapshot = buildNumberOperationsBaselineSummarySnapshot({
      profile,
      subElementAttempts: [trace],
      startedAt: "2026-10-03T08:00:00Z",
      completedAt: "2026-10-03T08:10:00Z",
    });

    const draft = buildNumberOperationsBaselinePersistenceDraft(snapshot);

    expect(draft.attempt).toMatchObject({
      schemaVersion: 1,
      frameworkId: "MYL-MATH-AU-NUMERACY-V9",
      formId: "number-operations-baseline",
      formVersion: 1,
      mode: "diagnostic",
      status: "partial",
      assessedSubElements: 1,
      expectedSubElements: 5,
      sourceRoute: "/assessment-lab/placement-simulator",
    });
    expect(draft.responses).toHaveLength(3);
    expect(draft.responses.map((response) => response.itemOrder)).toEqual([1, 2, 3]);
    expect(draft.responses[1]).toMatchObject({
      subElementKey: "number-place-value",
      stageKind: "initial",
      progressionLevel: 6,
      itemId: "anchor-b",
      responseValue: "3400",
      correct: false,
      timeSpentSeconds: 7,
    });
    expect(draft.responses[2]).toMatchObject({
      stageKind: "boundary",
      progressionLevel: 4,
      bracketLowerP: 3,
      bracketUpperP: 6,
      correct: true,
    });
  });

  it("attaches exact item version and registry snapshot for canonical items", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 5,
      upperP: 6,
    });
    const profile = buildNumberOperationsProfile([result]);
    const trace = buildNumberOperationsSubElementAttemptTrace({
      subElementKey: "number-place-value",
      subElementLabel: "Number and place value",
      stages: [
        {
          stage: "initial",
          pLevel: 6,
          responses: [
            {
              itemId: "myl-anchor-npv-p06-a-v1",
              selectedOptionIds: [
                "four-thousands-three-hundreds",
                "three-thousands-thirteen-hundreds",
                "forty-three-hundreds",
              ],
              correct: true,
              skillId: "npv-p6-flexible-renaming",
              misconceptionTags: [],
            },
          ],
        },
      ],
      routeTrace: [],
      result,
    });
    const snapshot = buildNumberOperationsBaselineSummarySnapshot({
      profile,
      subElementAttempts: [trace],
      startedAt: "2026-10-03T08:00:00Z",
      completedAt: "2026-10-03T08:02:00Z",
    });

    const draft = buildNumberOperationsBaselinePersistenceDraft(snapshot);
    const row = draft.responses[0];

    expect(row).toMatchObject({
      itemId: "myl-anchor-npv-p06-a-v1",
      itemVersion: 1,
      itemPoolKind: "anchor",
      itemPoolKey: "number-place-value-p6",
    });
    expect(row.itemSnapshot).toMatchObject({
      id: "myl-anchor-npv-p06-a-v1",
      version: 1,
      prompt: "Select every representation equal to 4,300.",
    });
  });

  it("does not create any database identifiers or learner/family fields", () => {
    const snapshot = buildNumberOperationsBaselineSummarySnapshot({
      profile: buildNumberOperationsProfile([]),
      startedAt: "2026-10-03T08:00:00Z",
      completedAt: "2026-10-03T08:01:00Z",
    });

    const draft = buildNumberOperationsBaselinePersistenceDraft(snapshot);
    const serialized = JSON.stringify(draft);

    expect(serialized).not.toContain("familyId");
    expect(serialized).not.toContain("learnerId");
    expect(serialized).not.toContain("createdByUserId");
    expect(serialized).not.toContain("pathwayStepId");
  });
});
