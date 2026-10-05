import { describe, expect, it } from "vitest";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";
import { buildNumberOperationsCandidateBandResult } from "./numberOperationsPlacementResult";
import { buildNumberOperationsEvidencePreview } from "./numberOperationsEvidencePreview";
import { buildNumberOperationsEvidenceConfirmationDraft } from "./numberOperationsEvidenceConfirmation";

function preview() {
  return buildNumberOperationsEvidencePreview(
    buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 5,
        upperP: 6,
      }),
    ]),
  );
}

describe("Number & Operations evidence confirmation", () => {
  it("requires explicit parent acknowledgement", () => {
    expect(() =>
      buildNumberOperationsEvidenceConfirmationDraft({
        preview: preview(),
        parentAcknowledgedStartingPoint: false,
        includeInPortfolio: true,
        includeInReport: true,
      }),
    ).toThrow(/Parent acknowledgement is required/i);
  });

  it("creates a versioned confirmation intent without changing pathway or confidence state", () => {
    const draft = buildNumberOperationsEvidenceConfirmationDraft({
      preview: preview(),
      parentAcknowledgedStartingPoint: true,
      includeInPortfolio: true,
      includeInReport: false,
      parentNote: "We also saw this during shopping this week.",
      confirmedAt: "2026-10-04T09:30:00.000Z",
    });

    expect(draft).toMatchObject({
      schema: "mylearna-number-operations-evidence-confirmation",
      schemaVersion: 1,
      sourceType: "mylearna_assessment",
      sourceFormId: "number-operations-baseline",
      parentAcknowledgedStartingPoint: true,
      includeInPortfolio: true,
      includeInReport: false,
      parentNote: "We also saw this during shopping this week.",
      scopeSubElements: [
        "number-place-value",
        "counting-processes",
        "additive-strategies",
        "multiplicative-strategies",
        "understanding-money",
      ],
      safeguards: {
        updatesPathwayStatusAutomatically: false,
        updatesAssessmentConfidenceAutomatically: false,
        createsFormalReportStatementAutomatically: false,
      },
    });
    expect(draft.curriculumNodeIds).toContain(
      "mylearna::mathematics::au-numeracy-v9::number-place-value::p5-p6",
    );
  });

  it("allows a parent to keep the learning record private from Portfolio and reports", () => {
    const draft = buildNumberOperationsEvidenceConfirmationDraft({
      preview: preview(),
      parentAcknowledgedStartingPoint: true,
      includeInPortfolio: false,
      includeInReport: false,
      parentNote: " ",
      confirmedAt: "2026-10-04T09:31:00.000Z",
    });

    expect(draft.includeInPortfolio).toBe(false);
    expect(draft.includeInReport).toBe(false);
    expect(draft.parentNote).toBeNull();
  });
});


it("rejects confirmation when every area remains unresolved", () => {
  const emptyPreview = buildNumberOperationsEvidencePreview(
    buildNumberOperationsProfile([]),
  );

  expect(() =>
    buildNumberOperationsEvidenceConfirmationDraft({
      preview: emptyPreview,
      parentAcknowledgedStartingPoint: true,
      includeInPortfolio: true,
      includeInReport: false,
    }),
  ).toThrow(/No reportable assessment evidence is available/i);
});


it("allows Portfolio confirmation but rejects report inclusion for routing-only evidence", () => {
  const routingOnlyPreview = buildNumberOperationsEvidencePreview(
    buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "additive-strategies",
        lowerP: 2,
        upperP: 3,
        evidenceLimitations: [
          "Observed strategy evidence is required before a stronger claim.",
        ],
      }),
    ]),
  );

  const portfolioDraft = buildNumberOperationsEvidenceConfirmationDraft({
    preview: routingOnlyPreview,
    parentAcknowledgedStartingPoint: true,
    includeInPortfolio: true,
    includeInReport: false,
  });
  expect(portfolioDraft.includeInPortfolio).toBe(true);
  expect(portfolioDraft.includeInReport).toBe(false);

  expect(() =>
    buildNumberOperationsEvidenceConfirmationDraft({
      preview: routingOnlyPreview,
      parentAcknowledgedStartingPoint: true,
      includeInPortfolio: true,
      includeInReport: true,
    }),
  ).toThrow(/stronger verification.*reports/i);
});


it("preserves focused scope in a confirmed evidence intent", () => {
  const focusedPreview = buildNumberOperationsEvidencePreview(
    buildNumberOperationsProfile(
      [
        buildNumberOperationsCandidateBandResult({
          subElementKey: "understanding-money",
          lowerP: 5,
          upperP: 6,
        }),
      ],
      { expectedSubElementKeys: ["understanding-money"] },
    ),
  );

  const draft = buildNumberOperationsEvidenceConfirmationDraft({
    preview: focusedPreview,
    parentAcknowledgedStartingPoint: true,
    includeInPortfolio: true,
    includeInReport: true,
  });

  expect(draft.scopeSubElements).toEqual(["understanding-money"]);
  expect(draft.resultBands).toHaveLength(1);
  expect(draft.resultBands[0]?.subElementKey).toBe("understanding-money");
});


it("keeps raw assessment responses out of the Portfolio/report confirmation payload", () => {
  const draft = buildNumberOperationsEvidenceConfirmationDraft({
    preview: preview(),
    parentAcknowledgedStartingPoint: true,
    includeInPortfolio: true,
    includeInReport: false,
    parentNote: "Observed confidently during normal learning.",
  });

  const serialized = JSON.stringify(draft);

  expect(serialized).not.toContain("selectedOptionIds");
  expect(serialized).not.toContain("responseValue");
  expect(serialized).not.toContain("misconceptionTags");
  expect(serialized).not.toContain("timeSpentSeconds");
  expect(serialized).not.toContain('"correct"');
  expect(serialized).toContain("curriculumNodeIds");
  expect(serialized).toContain("resultBands");
});
