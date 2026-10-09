import { describe, expect, it, vi } from "vitest";
import { buildNumberOperationsEvidencePreview } from "@/lib/clean/assessments/placement/numberOperationsEvidencePreview";
import { getNumberOperationsPlacementItemById } from "@/lib/clean/assessments/placement/numberOperationsItemRegistry";
import type {
  NumberOperationsBaselinePersistenceDraft,
  NumberOperationsBaselineResponsePersistenceDraft,
} from "@/lib/clean/assessments/placement/numberOperationsPersistenceDraft";
import { buildNumberOperationsEndpointResult } from "@/lib/clean/assessments/placement/numberOperationsPlacementResult";
import { buildNumberOperationsProfile } from "@/lib/clean/assessments/placement/numberOperationsProfile";
import { projectTrustedStartingPointPersistence } from "./startingPointPersistenceAuthority.server";

vi.mock("server-only", () => ({}));

function response(input: {
  itemId: string;
  itemOrder: number;
  stageKind: NumberOperationsBaselineResponsePersistenceDraft["stageKind"];
  pLevel: number;
  direction?: "up" | "down";
  responseValue: string;
}): NumberOperationsBaselineResponsePersistenceDraft {
  const entry = getNumberOperationsPlacementItemById(input.itemId);
  if (!entry) throw new Error(`Missing test item ${input.itemId}`);
  return {
    subElementKey: "counting-processes",
    stageKind: input.stageKind,
    progressionLevel: input.pLevel,
    stageDirection: input.direction ?? null,
    bracketLowerP: null,
    bracketUpperP: null,
    itemId: input.itemId,
    itemVersion: entry.item.version,
    itemPoolKind: entry.poolKind,
    itemPoolKey: entry.poolKey,
    itemSnapshot: { clientClaim: "ignored" },
    itemOrder: input.itemOrder,
    selectedOptionIds: [],
    responseValue: input.responseValue,
    correct: false,
    skillId: "client-claim",
    misconceptionTags: ["client-claim"],
    timeSpentSeconds: 4,
  };
}

function focusedCountingDraft(): NumberOperationsBaselinePersistenceDraft {
  const endpoint = buildNumberOperationsEndpointResult({
    subElementKey: "counting-processes",
    relation: "at-least",
    pLevel: 8,
  });
  const profile = buildNumberOperationsProfile([endpoint], {
    expectedSubElementKeys: ["counting-processes"],
  });
  return {
    attempt: {
      schemaVersion: 1,
      frameworkId: "MYL-MATH-AU-NUMERACY-V9",
      formId: "number-operations-baseline",
      formVersion: 1,
      mode: "diagnostic",
      status: "complete",
      startedAt: "2026-10-09T01:00:00.000Z",
      completedAt: "2026-10-09T01:08:00.000Z",
      assessedSubElements: 1,
      expectedSubElements: 1,
      scopeSubElements: ["counting-processes"],
      unresolvedSubElements: [],
      profileSnapshot: profile,
      evidencePreviewSnapshot: buildNumberOperationsEvidencePreview(profile),
      sourceRoute: "/assessments/maths-starting-point",
    },
    responses: [
      response({
        itemId: "myl-anchor-cnt-p05-a-v1",
        itemOrder: 1,
        stageKind: "initial",
        pLevel: 5,
        responseValue: "62",
      }),
      response({
        itemId: "myl-anchor-cnt-p05-b-v1",
        itemOrder: 2,
        stageKind: "initial",
        pLevel: 5,
        responseValue: "14",
      }),
      response({
        itemId: "myl-anchor-cnt-p07-a-v1",
        itemOrder: 3,
        stageKind: "branch",
        pLevel: 7,
        direction: "up",
        responseValue: "28",
      }),
      response({
        itemId: "myl-anchor-cnt-p07-b-v1",
        itemOrder: 4,
        stageKind: "branch",
        pLevel: 7,
        direction: "up",
        responseValue: "47",
      }),
      response({
        itemId: "myl-search-cnt-p08-a-v1",
        itemOrder: 5,
        stageKind: "search",
        pLevel: 8,
        direction: "up",
        responseValue: "2.8",
      }),
      response({
        itemId: "myl-search-cnt-p08-b-v1",
        itemOrder: 6,
        stageKind: "search",
        pLevel: 8,
        direction: "up",
        responseValue: "6",
      }),
    ],
  };
}

describe("Starting Point persistence authority bridge", () => {
  it("re-scores and route-replays evidence before projecting five canonical results", () => {
    const projected = projectTrustedStartingPointPersistence({
      draft: focusedCountingDraft(),
      learnerId: "learner-a",
      attemptId: "trusted-attempt-a",
      attemptKind: "initial",
      allowNonPublishedItems: true,
    });

    expect(projected.trustedDraft.responses.every((entry) => entry.correct)).toBe(true);
    expect(
      projected.trustedDraft.responses.every(
        (entry) => entry.skillId !== "client-claim",
      ),
    ).toBe(true);
    expect(projected.results).toHaveLength(5);
    expect(projected.attempt).toMatchObject({
      attemptId: "trusted-attempt-a",
      completionState: "focused",
      expectedResultCount: 5,
      scopeContinuumIds: ["counting-processes"],
    });
    expect(
      projected.results.find(
        (entry) => entry.construct.continuumId === "counting-processes",
      ),
    ).toMatchObject({
      interpretation: {
        sourceMeaning: { placementStatus: "endpoint" },
      },
      provenance: {
        deterministicRule: { ruleVersion: "v1" },
        sourceItemVersions: expect.arrayContaining([
          { itemId: "myl-anchor-cnt-p05-a-v1", itemVersion: 1 },
        ]),
      },
    });
    expect(
      projected.results.filter(
        (entry) => entry.evidence.assessmentScope === "not-assessed",
      ),
    ).toHaveLength(4);
  });

  it("rejects a client-submitted interpretation that disagrees with replayed evidence", () => {
    const draft = focusedCountingDraft();
    draft.attempt.profileSnapshot.results = [
      buildNumberOperationsEndpointResult({
        subElementKey: "counting-processes",
        relation: "below-or-around",
        pLevel: 1,
      }),
    ];

    expect(() =>
      projectTrustedStartingPointPersistence({
        draft,
        learnerId: "learner-a",
        attemptId: "trusted-attempt-a",
        attemptKind: "initial",
        allowNonPublishedItems: true,
      }),
    ).toThrow(/does not match replayed trusted evidence/i);
  });
});
