import { describe, expect, it } from "vitest";
import {
  buildLearnerContextHref,
  CANONICAL_LEARNER_CONTEXT_PARAM,
} from "@/lib/clean/learners/learnerContextHref";

describe("buildLearnerContextHref", () => {
  it("uses learner_id as the canonical learner context key", () => {
    expect(CANONICAL_LEARNER_CONTEXT_PARAM).toBe("learner_id");
    expect(buildLearnerContextHref("/my-portfolio", "learner-a")).toBe(
      "/my-portfolio?learner_id=learner-a",
    );
  });

  it("preserves existing source parameters and an exact fragment", () => {
    expect(
      buildLearnerContextHref(
        "/my-pathways?subject=mathematics&source=portfolio#step-number-1",
        "learner-a",
      ),
    ).toBe(
      "/my-pathways?subject=mathematics&source=portfolio&learner_id=learner-a#step-number-1",
    );
  });

  it("adds return context without replacing an existing query", () => {
    expect(
      buildLearnerContextHref("/my-capture?mode=quick", "learner-a", {
        returnTo: "/my-portfolio?learner_id=learner-a",
      }),
    ).toBe(
      "/my-capture?mode=quick&returnTo=%2Fmy-portfolio%3Flearner_id%3Dlearner-a&learner_id=learner-a",
    );
  });

  it("replaces a legacy learnerId value instead of producing conflicting learner context", () => {
    expect(buildLearnerContextHref("/my-portfolio?learnerId=old-learner", "learner-a")).toBe(
      "/my-portfolio?learner_id=learner-a",
    );
  });

  it("keeps the existing href when no learner is available", () => {
    expect(buildLearnerContextHref("/my-portfolio?source=my-capture", "")).toBe(
      "/my-portfolio?source=my-capture",
    );
  });
});
