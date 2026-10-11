import { describe, expect, it } from "vitest";
import {
  buildNumberOperationsBaselineDraft,
  parseNumberOperationsBaselineDraft,
} from "./numberOperationsBaselineDraft";
import { buildNumberOperationsCandidateBandResult } from "./numberOperationsPlacementResult";

describe("Number Operations baseline browser draft", () => {
  it("round-trips completed area progress without learner identity", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 5,
      upperP: 6,
    });

    const draft = buildNumberOperationsBaselineDraft({
      currentIndex: 1,
      resultsByKey: { "number-place-value": result },
      unresolvedSubElements: [],
      tracesByKey: {},
      startedAt: "2026-10-03T08:00:00Z",
      savedAt: "2026-10-03T08:10:00Z",
    });

    const parsed = parseNumberOperationsBaselineDraft(JSON.stringify(draft));

    expect(parsed).toMatchObject({
      schema: "mylearna-number-operations-baseline-draft",
      schemaVersion: 1,
      currentIndex: 1,
      startedAt: "2026-10-03T08:00:00.000Z",
      savedAt: "2026-10-03T08:10:00.000Z",
    });
    expect(parsed?.resultsByKey["number-place-value"]?.lowerP).toBe(5);

    const serialized = JSON.stringify(parsed);
    expect(serialized).not.toContain("learnerId");
    expect(serialized).not.toContain("familyId");
    expect(serialized).not.toContain("userId");
  });

  it("deduplicates unresolved sub-elements", () => {
    const draft = buildNumberOperationsBaselineDraft({
      currentIndex: 2,
      resultsByKey: {},
      unresolvedSubElements: ["counting-processes", "counting-processes"],
      tracesByKey: {},
      startedAt: "2026-10-03T08:00:00Z",
      savedAt: "2026-10-03T08:10:00Z",
    });

    expect(draft.unresolvedSubElements).toEqual(["counting-processes"]);
  });

  it("rejects malformed or future-schema drafts", () => {
    expect(parseNumberOperationsBaselineDraft("not json")).toBeNull();
    expect(
      parseNumberOperationsBaselineDraft(
        JSON.stringify({
          schema: "mylearna-number-operations-baseline-draft",
          schemaVersion: 2,
          currentIndex: 1,
        }),
      ),
    ).toBeNull();
  });

  it("rejects out-of-range current indexes", () => {
    expect(() =>
      buildNumberOperationsBaselineDraft({
        currentIndex: 5,
        resultsByKey: {},
        unresolvedSubElements: [],
        tracesByKey: {},
        startedAt: "2026-10-03T08:00:00Z",
      }),
    ).toThrow(/0 to 4/i);
  });
});
