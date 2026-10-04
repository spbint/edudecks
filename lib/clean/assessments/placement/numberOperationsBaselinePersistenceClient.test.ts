import { describe, expect, it } from "vitest";
import { saveNumberOperationsBaseline } from "./numberOperationsBaselinePersistenceClient";

describe("Number & Operations baseline persistence client", () => {
  it("is hard-disabled by the release gate before any persistence can run", async () => {
    await expect(
      saveNumberOperationsBaseline({
        familyId: "family-1",
        learnerId: "learner-1",
        clientSubmissionId: "submission-123",
        draft: {
          attempt: {
            schemaVersion: 1,
            frameworkId: "MYL-MATH-AU-NUMERACY-V9",
            formId: "number-operations-baseline",
            formVersion: 1,
            mode: "diagnostic",
            status: "partial",
            startedAt: "2026-10-04T10:00:00.000Z",
            completedAt: "2026-10-04T10:10:00.000Z",
            assessedSubElements: 0,
            expectedSubElements: 5,
            unresolvedSubElements: [],
            profileSnapshot: {
              frameworkId: "MYL-MATH-AU-NUMERACY-V9",
              expectedSubElements: 5,
              assessedSubElements: 0,
              complete: false,
              directOrProvisionalCount: 0,
              routingOnlyCount: 0,
              overallStatement: "No reportable results yet.",
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
              summary: "No reportable results yet.",
              learningArea: "Mathematics",
              assessedSubElements: 0,
              expectedSubElements: 5,
              routingOnlySubElements: 0,
              curriculumNodeIds: [],
              resultBands: [],
              requiresParentConfirmation: true,
              portfolioEligibleAfterConfirmation: true,
              reportEligibleAfterConfirmation: true,
            },
            sourceRoute: "/assessment-lab/placement-simulator",
          },
          responses: [],
        },
      }),
    ).rejects.toThrow(/persistence is disabled/i);
  });
});
