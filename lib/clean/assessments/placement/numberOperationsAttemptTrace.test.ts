import { describe, expect, it } from "vitest";
import { buildNumberOperationsCandidateBandResult } from "./numberOperationsPlacementResult";
import { buildNumberOperationsSubElementAttemptTrace } from "./numberOperationsAttemptTrace";

describe("Number Operations sub-element attempt trace", () => {
  it("preserves administered responses and routing context", () => {
    const result = buildNumberOperationsCandidateBandResult({
      subElementKey: "number-place-value",
      lowerP: 4,
      upperP: 5,
    });

    const trace = buildNumberOperationsSubElementAttemptTrace({
      subElementKey: "number-place-value",
      subElementLabel: "Number and place value",
      stages: [
        {
          stage: "initial",
          pLevel: 6,
          responses: [
            {
              itemId: "item-a",
              selectedOptionIds: ["a"],
              correct: false,
              skillId: "skill-a",
              misconceptionTags: ["mis-a"],
              timeSpentSeconds: 12,
            },
            {
              itemId: "item-b",
              selectedOptionIds: [],
              responseValue: "3400",
              correct: false,
              skillId: "skill-b",
              misconceptionTags: [],
              timeSpentSeconds: 8,
            },
          ],
        },
        {
          stage: "boundary",
          pLevel: 4,
          bracket: { lowerP: 3, upperP: 6 },
          responses: [
            {
              itemId: "item-c",
              selectedOptionIds: ["b"],
              correct: true,
              skillId: "skill-c",
              misconceptionTags: [],
            },
          ],
        },
      ],
      routeTrace: [
        "Initial evidence routed down from P6 to P3.",
        "Boundary search continues at P4.",
      ],
      result,
    });

    expect(trace).toMatchObject({
      schema: "mylearna-number-operations-sub-element-attempt",
      schemaVersion: 1,
      subElementKey: "number-place-value",
      itemCount: 3,
      correctCount: 1,
      incorrectCount: 2,
    });
    expect(trace.stages[0].responses[1].responseValue).toBe("3400");
    expect(trace.stages[1].bracket).toEqual({ lowerP: 3, upperP: 6 });
    expect(trace.result?.lowerP).toBe(4);
    expect(trace.routeTrace).toHaveLength(2);
  });

  it("does not alias mutable response arrays", () => {
    const selected = ["a"];
    const misconceptions = ["m1"];

    const trace = buildNumberOperationsSubElementAttemptTrace({
      subElementKey: "counting-processes",
      subElementLabel: "Counting processes",
      stages: [
        {
          stage: "initial",
          pLevel: 5,
          responses: [
            {
              itemId: "item",
              selectedOptionIds: selected,
              correct: true,
              skillId: "skill",
              misconceptionTags: misconceptions,
            },
          ],
        },
      ],
      routeTrace: [],
      result: null,
    });

    selected.push("b");
    misconceptions.push("m2");

    expect(trace.stages[0].responses[0].selectedOptionIds).toEqual(["a"]);
    expect(trace.stages[0].responses[0].misconceptionTags).toEqual(["m1"]);
  });
});
