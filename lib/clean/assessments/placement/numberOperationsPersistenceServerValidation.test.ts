import { describe, expect, it } from "vitest";
import {
  sanitizeNumberOperationsBaselinePersistenceDraft,
} from "./numberOperationsPersistenceServerValidation";
import type {
  NumberOperationsBaselinePersistenceDraft,
} from "./numberOperationsPersistenceDraft";

function baseDraft(): NumberOperationsBaselinePersistenceDraft {
  return {
    attempt: {
      schemaVersion: 1,
      frameworkId: "MYL-MATH-AU-NUMERACY-V9",
      formId: "number-operations-baseline",
      formVersion: 1,
      mode: "diagnostic",
      status: "complete",
      startedAt: "2026-10-05T01:00:00.000Z",
      completedAt: "2026-10-05T01:05:00.000Z",
      assessedSubElements: 1,
      expectedSubElements: 1,
      scopeSubElements: ["counting-processes"],
      unresolvedSubElements: [],
      profileSnapshot: {
        frameworkId: "MYL-MATH-AU-NUMERACY-V9",
        expectedSubElementKeys: ["counting-processes"],
        expectedSubElements: 1,
        assessedSubElements: 1,
        complete: true,
        directOrProvisionalCount: 1,
        routingOnlyCount: 0,
        overallStatement: "Focused result.",
        results: [],
        nextChecks: [],
        recommendations: [],
      },
      evidencePreviewSnapshot: {
        kind: "mylearna-assessment-evidence-preview-v1",
        sourceType: "mylearna_assessment",
        sourceFormId: "number-operations-baseline",
        frameworkId: "MYL-MATH-AU-NUMERACY-V9",
        title: "MyLearna Number & Operations baseline",
        summary: "Focused result.",
        learningArea: "Mathematics",
        assessedSubElements: 1,
        expectedSubElements: 1,
        scopeSubElements: ["counting-processes"],
        routingOnlySubElements: 0,
        curriculumNodeIds: ["test-node"],
        resultBands: [],
        requiresParentConfirmation: true,
        portfolioEligibleAfterConfirmation: true,
        reportEligibleAfterConfirmation: true,
      },
      sourceRoute: "/assessments/maths-starting-point",
    },
    responses: [
      {
        subElementKey: "counting-processes",
        stageKind: "initial",
        progressionLevel: 5,
        stageDirection: null,
        bracketLowerP: null,
        bracketUpperP: null,
        itemId: "myl-anchor-cnt-p05-a-v1",
        itemVersion: 1,
        itemPoolKind: "anchor",
        itemPoolKey: "counting-processes-p5",
        itemSnapshot: { tampered: true },
        itemOrder: 1,
        selectedOptionIds: [],
        responseValue: "62",
        correct: false,
        skillId: "tampered-skill",
        misconceptionTags: ["tampered-tag"],
        timeSpentSeconds: 7,
      },
    ],
  };
}

describe("Number & Operations server persistence evidence validation", () => {
  it("re-scores browser responses and rebuilds trusted item metadata", () => {
    const sanitized = sanitizeNumberOperationsBaselinePersistenceDraft(
      baseDraft(),
      { allowNonPublishedItems: true },
    );
    const response = sanitized.responses[0];

    expect(response).toMatchObject({
      itemId: "myl-anchor-cnt-p05-a-v1",
      correct: true,
      skillId: "counting-processes-p5-next-previous",
      misconceptionTags: [],
      itemVersion: 1,
      itemPoolKind: "anchor",
      itemPoolKey: "counting-processes-p5",
      responseValue: "62",
    });
    expect(response.itemSnapshot).toMatchObject({
      id: "myl-anchor-cnt-p05-a-v1",
      version: 1,
    });
    expect(response.itemSnapshot).not.toEqual({ tampered: true });
  });

  it("requires published items by default", () => {
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(baseDraft()),
    ).toThrow(/not published/i);
  });

  it("rejects area, level or routing-stage claims that do not match the registry", () => {
    const wrongArea = baseDraft();
    wrongArea.responses[0]!.subElementKey = "additive-strategies";
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(wrongArea, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/outside the requested.*scope|claimed area/i);

    const wrongLevel = baseDraft();
    wrongLevel.responses[0]!.progressionLevel = 6;
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(wrongLevel, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/claimed area\/progression level/i);

    const wrongStage = baseDraft();
    wrongStage.responses[0]!.stageKind = "search";
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(wrongStage, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/does not belong to stage/i);
  });

  it("rejects stale registry metadata and invalid response shapes", () => {
    const stale = baseDraft();
    stale.responses[0]!.itemVersion = 99;
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(stale, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/stale|registry/i);

    const invalid = baseDraft();
    invalid.responses[0]!.selectedOptionIds = ["made-up-option"];
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(invalid, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/Short-answer item.*cannot contain option ids|unknown option id/i);
  });

  it("rejects duplicate/non-contiguous response identity and mismatched attempt scope", () => {
    const duplicate = baseDraft();
    duplicate.responses.push({
      ...duplicate.responses[0]!,
      itemOrder: 2,
    });
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(duplicate, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/response item ids.*duplicates/i);

    const badScope = baseDraft();
    badScope.attempt.expectedSubElements = 2;
    expect(() =>
      sanitizeNumberOperationsBaselinePersistenceDraft(badScope, {
        allowNonPublishedItems: true,
      }),
    ).toThrow(/expectedSubElements must match scopeSubElements/i);
  });
});
