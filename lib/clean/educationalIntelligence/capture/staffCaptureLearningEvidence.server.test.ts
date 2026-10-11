import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseStaffCaptureEvidenceRequest } from "./staffCaptureLearningEvidence.server";

const valid = {
  operation: "link-capture-evidence",
  familyId: "41000000-0000-4000-8000-000000000001",
  learnerId: "42000000-0000-4000-8000-000000000001",
  evidenceId: "43000000-0000-4000-8000-000000000001",
  constructId: "MYL-MATH-AU-NUMERACY-V9::additive-strategies::at-least-P10",
  sourceType: "work-sample",
};

describe("governed staff Capture evidence requests", () => {
  it("accepts only bounded link and review operations", () => {
    expect(parseStaffCaptureEvidenceRequest(valid)).toEqual(valid);
    const common = {
      operation: valid.operation,
      familyId: valid.familyId,
      learnerId: valid.learnerId,
      evidenceId: valid.evidenceId,
      constructId: valid.constructId,
    };
    expect(
      parseStaffCaptureEvidenceRequest({
        ...common,
        operation: "review-capture-evidence-link",
        reviewState: "confirmed-relevant",
      }),
    ).toMatchObject({ reviewState: "confirmed-relevant" });
  });

  it.each(["developmentalStatus", "progression", "recommendation", "pathwayMutation", "portfolioInclusion"])(
    "rejects client-submitted educational truth field %s",
    (field) => {
      expect(() => parseStaffCaptureEvidenceRequest({ ...valid, [field]: "secure" })).toThrow(
        "Educational interpretation cannot be submitted",
      );
    },
  );

  it("rejects malformed, nonexistent-shaped, and free-text construct values before DB lookup", () => {
    for (const constructId of ["", "maths is secure", "<script>", "P6"]) {
      expect(() => parseStaffCaptureEvidenceRequest({ ...valid, constructId })).toThrow(
        "canonical construct identity",
      );
    }
  });
});
