import { describe, expect, it } from "vitest";
import {
  NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY,
  buildNumberOperationsBaselineDraft,
  parseNumberOperationsBaselineDraft,
} from "./numberOperationsBaselineDraft";
import { buildNumberOperationsCandidateBandResult } from "./numberOperationsPlacementResult";

describe("Number Operations baseline browser draft", () => {
  it("round-trips in-progress area progress without learner identity", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 5,
      upperP: 6,
    });

    const draft = buildNumberOperationsBaselineDraft({
      status: "in_progress",
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
      schemaVersion: 2,
      status: "in_progress",
      currentIndex: 1,
      startedAt: "2026-10-03T08:00:00.000Z",
      completedAt: null,
      savedAt: "2026-10-03T08:10:00.000Z",
    });
    expect(parsed?.resultsByKey["number-place-value"]?.lowerP).toBe(5);

    const serialized = JSON.stringify(parsed);
    expect(serialized).not.toContain("learnerId");
    expect(serialized).not.toContain("familyId");
    expect(serialized).not.toContain("userId");
  });

  it("round-trips a completed result so practice can return to the same profile", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 5,
      upperP: 6,
    });

    const draft = buildNumberOperationsBaselineDraft({
      status: "complete",
      currentIndex: 4,
      resultsByKey: { "number-place-value": result },
      unresolvedSubElements: ["counting-processes"],
      tracesByKey: {},
      startedAt: "2026-10-03T08:00:00Z",
      completedAt: "2026-10-03T08:20:00Z",
      savedAt: "2026-10-03T08:20:01Z",
    });

    const parsed = parseNumberOperationsBaselineDraft(JSON.stringify(draft));

    expect(parsed).toMatchObject({
      schemaVersion: 2,
      status: "complete",
      currentIndex: 4,
      completedAt: "2026-10-03T08:20:00.000Z",
    });
    expect(parsed?.resultsByKey["number-place-value"]?.upperP).toBe(6);
    expect(parsed?.tracesByKey).toEqual({});
  });

  it("uses a new storage namespace for the completion-aware contract", () => {
    expect(NUMBER_OPERATIONS_BASELINE_DRAFT_STORAGE_KEY).toContain(
      "baseline-draft:v2",
    );
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

  it("requires a valid completion timestamp only for complete drafts", () => {
    expect(() =>
      buildNumberOperationsBaselineDraft({
        status: "complete",
        currentIndex: 4,
        resultsByKey: {},
        unresolvedSubElements: [],
        tracesByKey: {},
        startedAt: "2026-10-03T08:00:00Z",
      }),
    ).toThrow(/completedAt is required/i);

    expect(() =>
      buildNumberOperationsBaselineDraft({
        status: "in_progress",
        currentIndex: 2,
        resultsByKey: {},
        unresolvedSubElements: [],
        tracesByKey: {},
        startedAt: "2026-10-03T08:00:00Z",
        completedAt: "2026-10-03T08:10:00Z",
      }),
    ).toThrow(/in-progress.*cannot have completedAt/i);
  });

  it("rejects malformed or future-schema drafts", () => {
    expect(parseNumberOperationsBaselineDraft("not json")).toBeNull();
    expect(
      parseNumberOperationsBaselineDraft(
        JSON.stringify({
          schema: "mylearna-number-operations-baseline-draft",
          schemaVersion: 3,
          status: "in_progress",
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
