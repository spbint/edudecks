import { describe, expect, it } from "vitest";
import { buildMyLearnaAuthDestination } from "./myLearnaAuthDestination";

describe("My Learna authentication destination", () => {
  it("preserves the canonical My Learna destination", () => {
    expect(buildMyLearnaAuthDestination()).toBe("/my-learna");
  });

  it("preserves encoded learner context without changing the destination origin", () => {
    expect(
      buildMyLearnaAuthDestination({
        learner_id: "learner/a?b",
        learnerId: "legacy-learner",
      }),
    ).toBe(
      "/my-learna?learner_id=learner%2Fa%3Fb&learnerId=legacy-learner",
    );
  });

  it("keeps hostile-looking query values inert on the internal route", () => {
    const destination = buildMyLearnaAuthDestination({
      next: "https://example.com/elsewhere",
    });

    expect(destination).toBe(
      "/my-learna?next=https%3A%2F%2Fexample.com%2Felsewhere",
    );
    expect(destination.startsWith("/my-learna?")).toBe(true);
  });
});
