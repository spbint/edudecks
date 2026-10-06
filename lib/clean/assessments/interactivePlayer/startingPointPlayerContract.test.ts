import { describe, expect, it } from "vitest";
import { scoreAssessmentItem } from "@/lib/clean/assessments/mylearnaAssessScoring";
import {
  ADDITIVE_P6_ANCHOR_ITEMS,
  ADDITIVE_P9_ANCHOR_ITEMS,
  COUNTING_P2_ANCHOR_ITEMS,
  MONEY_P2_ANCHOR_ITEMS,
  NPV_P3_ANCHOR_ITEMS,
  NPV_P9_ANCHOR_ITEMS,
} from "@/lib/clean/assessments/placement/numberOperationsP0Items";
import {
  adaptAssessmentItemForStartingPointPlayer,
  scoreStartingPointPlayerAnswer,
} from "./startingPointPlayerContract";

const representatives = [
  [ADDITIVE_P6_ANCHOR_ITEMS[0], "multiple-choice"],
  [ADDITIVE_P9_ANCHOR_ITEMS[1], "numeric-entry"],
  [COUNTING_P2_ANCHOR_ITEMS[0], "counter-counting"],
  [NPV_P9_ANCHOR_ITEMS[0], "drag-to-order"],
  [NPV_P3_ANCHOR_ITEMS[1], "place-value"],
  [MONEY_P2_ANCHOR_ITEMS[0], "australian-currency"],
] as const;

describe("Starting Point interactive player contract", () => {
  it("adapts canonical items without changing ids or versions", () => {
    for (const [item, kind] of representatives) {
      const model = adaptAssessmentItemForStartingPointPlayer(item);
      expect(model.itemId).toBe(item.id);
      expect(model.itemVersion).toBe(item.version);
      expect(model.kind).toBe(kind);
      expect(model.prompt).toBe(item.prompt);
    }
  });

  it("returns learner answers through the existing canonical scorer", () => {
    for (const [item] of representatives) {
      const selectedOptionIds = item.response.correctOptionIds || [];
      const responseValue = String(item.response.correctValue ?? "");
      const playerResult = scoreStartingPointPlayerAnswer({
        item,
        answer: {
          itemId: item.id,
          itemVersion: item.version,
          selectedOptionIds,
          ...(responseValue ? { responseValue } : {}),
        },
        timeSpentSeconds: 12,
      });
      const canonicalResult = scoreAssessmentItem(
        item,
        selectedOptionIds,
        12,
        responseValue || undefined,
      );

      expect(playerResult).toEqual(canonicalResult);
    }
  });

  it("rejects a response replayed against a different canonical version", () => {
    const item = ADDITIVE_P6_ANCHOR_ITEMS[0];
    expect(() =>
      scoreStartingPointPlayerAnswer({
        item,
        answer: {
          itemId: item.id,
          itemVersion: item.version + 1,
          selectedOptionIds: ["a"],
        },
        timeSpentSeconds: 3,
      }),
    ).toThrow(/canonical item version/i);
  });

  it("preserves practical-observation flags for inaccessible visual constructs", () => {
    for (const item of [
      COUNTING_P2_ANCHOR_ITEMS[0],
      NPV_P3_ANCHOR_ITEMS[1],
      MONEY_P2_ANCHOR_ITEMS[0],
    ]) {
      expect(
        adaptAssessmentItemForStartingPointPlayer(item)
          .requiresPracticalAlternative,
        item.id,
      ).toBe(true);
    }
  });
});
