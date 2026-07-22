import { describe, expect, it } from "vitest";
import {
  isLearnerContextCurrent,
  resolveLearnerContext,
  validateLearnerContext,
} from "@/lib/clean/learnerContext";
import type { Learner } from "@/lib/clean/learners/types";

const learners: Learner[] = [
  {
    id: "learner-a",
    familyId: "family-a",
    firstName: "Asha",
    preferredName: null,
    surname: null,
    yearLevel: null,
    notes: null,
    createdByUserId: "user-a",
    createdAt: null,
    updatedAt: null,
  },
  {
    id: "learner-b",
    familyId: "family-a",
    firstName: "Beau",
    preferredName: null,
    surname: null,
    yearLevel: null,
    notes: null,
    createdByUserId: "user-a",
    createdAt: null,
    updatedAt: null,
  },
];

describe("authoritative learner context", () => {
  it("keeps contextual learner ahead of remembered and active learners", () => {
    const result = resolveLearnerContext({
      learners,
      contextualLearnerId: "learner-a",
      activeLearnerId: "learner-b",
      rememberedLearnerId: "learner-b",
    });

    expect(result.learner?.id).toBe("learner-a");
    expect(result.reason).toBe("context");
  });

  it("does not silently replace an incompatible explicit selection", () => {
    const result = resolveLearnerContext({
      learners,
      contextualLearnerId: "learner-a",
      explicitLearnerId: "learner-b",
    });

    expect(result.learner?.id).toBe("learner-a");
    expect(result.reason).toBe("mismatch");
    expect(result.mismatch).toBe(true);
  });

  it("requires selection instead of falling back from an invalid route learner", () => {
    const result = resolveLearnerContext({
      learners,
      explicitLearnerId: "learner-from-another-family",
      rememberedLearnerId: "learner-a",
    });

    expect(result.learner).toBeNull();
    expect(result.reason).toBe("invalid");
  });

  it("rejects cross-family and source/selected learner mismatches at save time", () => {
    expect(() =>
      validateLearnerContext(learners, {
        familyId: "family-a",
        selectedLearnerId: "learner-b",
        sourceLearnerId: "learner-a",
        sourceType: "my-pathways",
      }),
    ).toThrow("connected to Asha's pathway");

    expect(() =>
      validateLearnerContext(learners, {
        familyId: "family-other",
        selectedLearnerId: "learner-a",
      }),
    ).toThrow("Choose a learner from this family");
  });

  it("rejects deleted or stale contextual learners without exposing identifiers", () => {
    expect(() =>
      validateLearnerContext(learners, {
        familyId: "family-a",
        selectedLearnerId: "learner-a",
        sourceLearnerId: "deleted-learner",
        sourceType: "worksheet",
      }),
    ).toThrow("connection is no longer available");
    expect(isLearnerContextCurrent(learners, {
      familyId: "family-a",
      selectedLearnerId: "learner-a",
    })).toBe(true);
  });
});
