import { describe, expect, it } from "vitest";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";
import { buildNumberOperationsEndpointResult } from "./numberOperationsPlacementResult";
import { buildNumberOperationsEvidencePreview } from "./numberOperationsEvidencePreview";
import {
  getNumberOperationsPlacementItemById,
} from "./numberOperationsItemRegistry";
import type {
  NumberOperationsBaselinePersistenceDraft,
  NumberOperationsBaselineResponsePersistenceDraft,
} from "./numberOperationsPersistenceDraft";
import {
  buildTrustedNumberOperationsBaselinePersistenceDraft,
} from "./numberOperationsPersistenceRouteReplay";

function response(input: {
  itemId: string;
  itemOrder: number;
  stageKind: NumberOperationsBaselineResponsePersistenceDraft["stageKind"];
  pLevel: number;
  direction?: "down" | "up";
  responseValue: string;
}): NumberOperationsBaselineResponsePersistenceDraft {
  const entry = getNumberOperationsPlacementItemById(input.itemId);
  if (!entry) throw new Error(`Missing registry item ${input.itemId}`);

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
    itemSnapshot: { untrusted: true },
    itemOrder: input.itemOrder,
    selectedOptionIds: [],
    responseValue: input.responseValue,
    correct: false,
    skillId: "browser-supplied",
    misconceptionTags: ["browser-supplied"],
    timeSpentSeconds: 4,
  };
}

function countingEndpointDraft(): NumberOperationsBaselinePersistenceDraft {
  const result = buildNumberOperationsEndpointResult({
    subElementKey: "counting-processes",
    relation: "at-least",
    pLevel: 8,
  });
  const profile = buildNumberOperationsProfile([result], {
    expectedSubElementKeys: ["counting-processes"],
  });
  const evidencePreview = buildNumberOperationsEvidencePreview(profile);

  return {
    attempt: {
      schemaVersion: 1,
      frameworkId: "MYL-MATH-AU-NUMERACY-V9",
      formId: "number-operations-baseline",
      formVersion: 1,
      mode: "diagnostic",
      status: "complete",
      startedAt: "2026-10-05T02:00:00.000Z",
      completedAt: "2026-10-05T02:08:00.000Z",
      assessedSubElements: 1,
      expectedSubElements: 1,
      scopeSubElements: ["counting-processes"],
      unresolvedSubElements: [],
      profileSnapshot: profile,
      evidencePreviewSnapshot: evidencePreview,
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

describe("Number & Operations server route replay", () => {
  it("replays a real P5 → P7 → P8 Counting route and rebuilds the endpoint result", () => {
    const trusted = buildTrustedNumberOperationsBaselinePersistenceDraft(
      countingEndpointDraft(),
      { allowNonPublishedItems: true },
    );

    expect(trusted.attempt).toMatchObject({
      status: "complete",
      assessedSubElements: 1,
      expectedSubElements: 1,
      unresolvedSubElements: [],
    });
    expect(trusted.attempt.profileSnapshot.results).toHaveLength(1);
    expect(trusted.attempt.profileSnapshot.results[0]).toMatchObject({
      subElementKey: "counting-processes",
      status: "endpoint",
      endpoint: { relation: "at-least", pLevel: 8 },
      confidence: "provisional-moderate",
    });
    expect(trusted.responses.every((entry) => entry.correct)).toBe(true);
    expect(
      trusted.responses.every(
        (entry) => entry.skillId !== "browser-supplied",
      ),
    ).toBe(true);
  });

  it("rejects a browser placement band that disagrees with replayed responses", () => {
    const draft = countingEndpointDraft();
    draft.attempt.profileSnapshot.results = [
      buildNumberOperationsEndpointResult({
        subElementKey: "counting-processes",
        relation: "below-or-around",
        pLevel: 1,
      }),
    ];

    expect(() =>
      buildTrustedNumberOperationsBaselinePersistenceDraft(draft, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/profile does not match replayed trusted evidence/i);
  });

  it("rejects a stage sequence that the adaptive route could never produce", () => {
    const draft = countingEndpointDraft();
    draft.responses[2]!.stageDirection = "down";
    draft.responses[3]!.stageDirection = "down";

    expect(() =>
      buildTrustedNumberOperationsBaselinePersistenceDraft(draft, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/Unexpected counting-processes route stage/i);
  });

  it("treats an asset-gated Money lower route as unresolved rather than accepting hidden responses", () => {
    const initialA = getNumberOperationsPlacementItemById(
      "myl-anchor-mon-p05-a-v1",
    );
    const initialB = getNumberOperationsPlacementItemById(
      "myl-anchor-mon-p05-b-v1",
    );
    if (!initialA || !initialB) throw new Error("Money P5 items missing.");

    const profile = buildNumberOperationsProfile([], {
      expectedSubElementKeys: ["understanding-money"],
    });
    const evidencePreview = buildNumberOperationsEvidencePreview(profile);

    const draft: NumberOperationsBaselinePersistenceDraft = {
      attempt: {
        schemaVersion: 1,
        frameworkId: "MYL-MATH-AU-NUMERACY-V9",
        formId: "number-operations-baseline",
        formVersion: 1,
        mode: "diagnostic",
        status: "partial",
        startedAt: "2026-10-05T02:00:00.000Z",
        completedAt: "2026-10-05T02:03:00.000Z",
        assessedSubElements: 0,
        expectedSubElements: 1,
        scopeSubElements: ["understanding-money"],
        unresolvedSubElements: ["understanding-money"],
        profileSnapshot: profile,
        evidencePreviewSnapshot: evidencePreview,
        sourceRoute: "/assessments/maths-starting-point",
      },
      responses: [
        {
          subElementKey: "understanding-money",
          stageKind: "initial",
          progressionLevel: 5,
          stageDirection: null,
          bracketLowerP: null,
          bracketUpperP: null,
          itemId: initialA.item.id,
          itemVersion: initialA.item.version,
          itemPoolKind: initialA.poolKind,
          itemPoolKey: initialA.poolKey,
          itemSnapshot: {},
          itemOrder: 1,
          selectedOptionIds: ["b"],
          responseValue: null,
          correct: true,
          skillId: "browser-supplied",
          misconceptionTags: [],
          timeSpentSeconds: 3,
        },
        {
          subElementKey: "understanding-money",
          stageKind: "initial",
          progressionLevel: 5,
          stageDirection: null,
          bracketLowerP: null,
          bracketUpperP: null,
          itemId: initialB.item.id,
          itemVersion: initialB.item.version,
          itemPoolKind: initialB.poolKind,
          itemPoolKey: initialB.poolKey,
          itemSnapshot: {},
          itemOrder: 2,
          selectedOptionIds: [],
          responseValue: "0",
          correct: true,
          skillId: "browser-supplied",
          misconceptionTags: [],
          timeSpentSeconds: 3,
        },
      ],
    };

    const trusted = buildTrustedNumberOperationsBaselinePersistenceDraft(
      draft,
      { allowNonPublishedItems: true },
    );
    expect(trusted.attempt.status).toBe("partial");
    expect(trusted.attempt.assessedSubElements).toBe(0);
    expect(trusted.attempt.unresolvedSubElements).toEqual([
      "understanding-money",
    ]);
  });
});
