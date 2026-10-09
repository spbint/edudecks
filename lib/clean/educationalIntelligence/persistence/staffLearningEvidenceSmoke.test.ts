import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { parseStaffLearningEvidenceSaveRequest } from "./staffLearningEvidenceSmoke.server";

const rawEvidence = {
  attempt: { status: "complete" },
  responses: [],
};

function request() {
  return {
    operation: "save-starting-point",
    familyId: "20000000-0000-4000-8000-000000000001",
    learnerId: "30000000-0000-4000-8000-000000000001",
    attemptId: "staff-ei-smoke:initial:learner:2026-10-09",
    attemptKind: "initial",
    draft: rawEvidence,
  };
}

describe("staff Learning Evidence save request", () => {
  it("accepts only the minimum evidence envelope used for authoritative replay", () => {
    expect(parseStaffLearningEvidenceSaveRequest(request())).toMatchObject({
      operation: "save-starting-point",
      attemptKind: "initial",
      draft: rawEvidence,
    });
  });

  it.each(["results", "developmentalStatus", "provenance", "recommendation"])(
    "rejects a client-submitted %s claim",
    (claim) => {
      expect(() =>
        parseStaffLearningEvidenceSaveRequest({
          ...request(),
          [claim]: { fake: true },
        }),
      ).toThrow(/only raw assessment evidence/i);
    },
  );

  it("rejects invalid tenant, learner, attempt and attempt-kind envelopes", () => {
    expect(() =>
      parseStaffLearningEvidenceSaveRequest({ ...request(), familyId: "family-a" }),
    ).toThrow(/family is invalid/i);
    expect(() =>
      parseStaffLearningEvidenceSaveRequest({ ...request(), learnerId: "learner-a" }),
    ).toThrow(/learner is invalid/i);
    expect(() =>
      parseStaffLearningEvidenceSaveRequest({ ...request(), attemptId: "short" }),
    ).toThrow(/attempt identity/i);
    expect(() =>
      parseStaffLearningEvidenceSaveRequest({ ...request(), attemptKind: "fake" }),
    ).toThrow(/attempt kind/i);
  });
});
