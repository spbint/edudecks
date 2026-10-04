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
