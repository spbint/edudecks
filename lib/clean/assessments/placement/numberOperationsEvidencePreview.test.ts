import { describe, expect, it } from "vitest";
import {
  buildNumberOperationsCandidateBandResult,
} from "./numberOperationsPlacementResult";
import { buildNumberOperationsProfile } from "./numberOperationsProfile";
import { buildNumberOperationsEvidencePreview } from "./numberOperationsEvidencePreview";

describe("Number Operations evidence preview", () => {
  it("projects the profile into a confirmation-gated evidence preview", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "number-place-value",
        lowerP: 5,
        upperP: 6,
      }),
      buildNumberOperationsCandidateBandResult({
        subElementKey: "counting-processes",
        lowerP: 4,
        upperP: 5,
        evidenceLimitations: [
          "Observed counting behaviour is not available in this route.",
        ],
      }),
    ]);

    const preview = buildNumberOperationsEvidencePreview(profile);

    expect(preview).toMatchObject({
      kind: "mylearna-assessment-evidence-preview-v1",
      sourceType: "mylearna_assessment",
      sourceFormId: "number-operations-baseline",
      title: "MyLearna Number & Operations baseline",
      learningArea: "Mathematics",
      assessedSubElements: 2,
      expectedSubElements: 5,
      routingOnlySubElements: 1,
      requiresParentConfirmation: true,
      portfolioEligibleAfterConfirmation: true,
      reportEligibleAfterConfirmation: true,
    });
    expect(preview.summary).toMatch(/separate progression bands/i);
    expect(preview.summary).toMatch(/routing-only/i);
    expect(preview.curriculumNodeIds).toContain(
      "mylearna::mathematics::au-numeracy-v9::number-place-value::p5-p6",
    );
    expect(preview.resultBands).toEqual([
      {
        subElementKey: "number-place-value",
        subElementLabel: "Number and place value",
        bandLabel: "P5–P6",
        confidence: "provisional-moderate",
      },
      {
        subElementKey: "counting-processes",
        subElementLabel: "Counting processes",
        bandLabel: "P4–P5",
        confidence: "routing-only",
      },
    ]);
  });

  it("never auto-confirms portfolio or report evidence", () => {
    const profile = buildNumberOperationsProfile([
      buildNumberOperationsCandidateBandResult({
        subElementKey: "understanding-money",
        lowerP: 5,
        upperP: 6,
      }),
    ]);

    const preview = buildNumberOperationsEvidencePreview(profile);

    expect(preview.requiresParentConfirmation).toBe(true);
    expect(preview.portfolioEligibleAfterConfirmation).toBe(true);
    expect(preview.reportEligibleAfterConfirmation).toBe(true);
    expect(preview).not.toHaveProperty("includeInPortfolio");
    expect(preview).not.toHaveProperty("includeInReport");
  });
});
